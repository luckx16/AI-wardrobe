'use client';

import { type FormEvent, type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';

import type { MessageClothChip } from '@/entities/message';
import type { ClientWeather } from '@/features/chat/api/chatApi';
import { getClothes } from '@/features/cloth/api/clothApi';
import { axiosInstance } from '@/shared/lib/axiosInstance';
import { getImgSrc } from '@/shared/lib/getImgSrc';
import type { ServerResponseType } from '@/shared/types';
import { ArrowUpIcon, PaperclipIcon } from '@/shared/ui';

import styles from './ChatInput.module.css';

export type ChatSendOptions = {
  useWardrobe?: boolean;
  createLook?: boolean;
  clothIds?: number[];
  clothPreview?: MessageClothChip[];
  weather?: ClientWeather | null;
};

interface ChatInputProps {
  onSend: (message: string, options?: ChatSendOptions) => void;
  isLoading?: boolean;
  wardrobeEnabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  isLoading,
  wardrobeEnabled = false,
  placeholder = 'Спросите о стиле, гардеробе или модных трендах...',
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [clothOptions, setClothOptions] = useState<
    { id: string; title: string; category: string | null; color: string | null; image: string | null }[]
  >([]);
  const [attachOpen, setAttachOpen] = useState(false);
  const [pickerDraftIds, setPickerDraftIds] = useState<string[]>([]);
  const [confirmedCloths, setConfirmedCloths] = useState<MessageClothChip[]>([]);
  const [weather, setWeather] = useState<ClientWeather | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const attachMenuId = useId();
  const attachRootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wardrobeEnabled) {
      setClothOptions([]);
      return;
    }
    let cancelled = false;
    void getClothes()
      .then((rows) => {
        if (!cancelled) {
          setClothOptions(
            rows.map((c) => ({
              id: c.id,
              title: c.title,
              category: c.category,
              color: c.color,
              image: c.image ?? null,
            })),
          );
        }
      })
      .catch(() => {
        if (!cancelled) setClothOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [wardrobeEnabled]);

  useEffect(() => {
    if (!attachOpen) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const el = attachRootRef.current;
      if (el && !el.contains(e.target as Node)) {
        setAttachOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [attachOpen]);

  const openAttachPicker = () => {
    if (!clothOptions.length || isLoading) return;
    setPickerDraftIds(confirmedCloths.map((c) => c.id));
    setAttachOpen(true);
  };

  const toggleDraft = (id: string) => {
    setPickerDraftIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const confirmAttach = () => {
    const next: MessageClothChip[] = clothOptions
      .filter((c) => pickerDraftIds.includes(c.id))
      .map((c) => ({
        id: c.id,
        title: c.title,
        category: c.category,
        color: c.color,
        image: c.image,
      }));
    setConfirmedCloths(next);
    setAttachOpen(false);
  };

  const clearAttachments = () => {
    setConfirmedCloths([]);
    setPickerDraftIds([]);
  };

  const fetchWeatherByCoords = async (lat: number, lon: number) => {
    const { data } = await axiosInstance.get<ServerResponseType<ClientWeather>>('/weather/coords', {
      params: { lat, lon },
    });
    return data.data;
  };

  const fetchWeatherByCity = async (city: string) => {
    const { data } = await axiosInstance.get<ServerResponseType<ClientWeather>>('/weather', {
      params: { city },
    });
    return data.data;
  };

  const toggleWeather = async () => {
    if (isLoading) return;

    if (weather) {
      setWeather(null);
      setWeatherError(null);
      return;
    }

    setWeatherLoading(true);
    setWeatherError(null);

    try {
      const savedCity = typeof window !== 'undefined' ? localStorage.getItem('user_city') : null;

      if (!navigator?.geolocation) {
        if (savedCity?.trim()) {
          const w = await fetchWeatherByCity(savedCity.trim());
          setWeather(w);
          return;
        }
        throw new Error('Геолокация недоступна в браузере');
      }

      const coords = await new Promise<{ lat: number; lon: number }>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
          (err) => reject(err),
          { enableHighAccuracy: true, timeout: 6000, maximumAge: 30_000 },
        );
      });

      const w = await fetchWeatherByCoords(coords.lat, coords.lon);
      setWeather(w);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Не удалось получить погоду';
      setWeather(null);
      setWeatherError(msg);
    } finally {
      setWeatherLoading(false);
    }
  };

  const submit = (createLook: boolean) => {
    if (!input.trim() || isLoading) return;

    const useWardrobe = createLook || confirmedCloths.length > 0;
    const clothIds = confirmedCloths.map((c) => Number(c.id)).filter((n) => Number.isFinite(n));

    onSend(input.trim(), {
      useWardrobe,
      createLook,
      clothIds: clothIds.length ? clothIds : undefined,
      clothPreview: confirmedCloths.length ? confirmedCloths : undefined,
      weather,
    });
    setInput('');
    setConfirmedCloths([]);
    setPickerDraftIds([]);
    setAttachOpen(false);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.inputWrapper}>
        <div className={styles.attachButtons}>
          <div className={styles.attachWrap} ref={attachRootRef}>
            <button
              type="button"
              className={`${styles.attachButton} ${attachOpen ? styles.attachButtonActive : ''}`}
              aria-label="Прикрепить вещи"
              onClick={() => (attachOpen ? setAttachOpen(false) : openAttachPicker())}
              disabled={isLoading || !wardrobeEnabled || !clothOptions.length}
              aria-expanded={attachOpen}
              aria-controls={attachMenuId}
              title={!wardrobeEnabled ? 'Войдите в аккаунт, чтобы прикреплять вещи' : 'Прикрепить вещи из гардероба'}
            >
              <PaperclipIcon />
            </button>

            {attachOpen ? (
              <div
                id={attachMenuId}
                className={styles.attachDropdown}
                role="dialog"
                aria-label="Выбор вещей из гардероба"
              >
                <span className={styles.clothPickerLabel}>Гардероб</span>
                <ul className={styles.clothList}>
                  {clothOptions.map((c) => (
                    <li key={c.id}>
                      <label className={styles.clothRow}>
                        <input
                          type="checkbox"
                          checked={pickerDraftIds.includes(c.id)}
                          onChange={() => toggleDraft(c.id)}
                          disabled={isLoading}
                        />
                        <span className={styles.clothRowText}>
                          <span className={styles.clothRowTitle}>{c.title}</span>
                          {[c.category, c.color].filter(Boolean).length > 0 ? (
                            <span className={styles.clothRowMeta}>
                              {[c.category, c.color].filter(Boolean).join(' · ')}
                            </span>
                          ) : null}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
                <div className={styles.attachDropdownFooter}>
                  <button type="button" className={styles.confirmAttachBtn} onClick={confirmAttach}>
                    Прикрепить
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className={styles.textarea}
          disabled={isLoading}
        />

        <div className={styles.submitWrapper}>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`${styles.submitButton} ${
              input.trim() && !isLoading ? styles.submitButtonActive : styles.submitButtonDisabled
            }`}
            aria-label="Отправить сообщение"
          >
            <ArrowUpIcon />
          </button>
        </div>
      </div>

      {wardrobeEnabled ? (
        <div className={styles.wardrobeBlock}>
          <div className={styles.wardrobeRow}>
            <button
              type="button"
              className={styles.createLookButton}
              onClick={() => submit(true)}
              disabled={!input.trim() || isLoading}
              title="Собрать образ и (при наличии) использовать ваш гардероб"
            >
              Создать лук
            </button>

            <button
              type="button"
              className={`${styles.weatherButton} ${weather ? styles.weatherButtonActive : ''}`}
              onClick={() => void toggleWeather()}
              disabled={isLoading || weatherLoading}
              aria-pressed={Boolean(weather)}
              title={weather ? 'Погода будет убрана из запроса' : 'Добавить текущую погоду в запрос'}
            >
              {weatherLoading ? 'Погода…' : weather ? 'Учёт погоды включён' : 'Учёт погоды'}
            </button>
          </div>

          {!clothOptions.length ? (
            <p className={styles.hintMuted}>В гардеробе пока нет обработанных вещей.</p>
          ) : null}

          {weather ? (
            <p className={styles.weatherMeta}>
              Сейчас: {weather.temperature}° (ощущается {weather.feels_like}°), {weather.description},{' '}
              ветер {weather.wind_speed} км/ч, влажн. {weather.humidity}%.
            </p>
          ) : weatherError ? (
            <p className={styles.weatherMeta}>Погода недоступна: {weatherError}</p>
          ) : null}

          {confirmedCloths.length > 0 ? (
            <div className={styles.pendingStrip}>
              <span className={styles.pendingStripLabel}>Прикреплённые вещи:</span>
              <ul className={styles.pendingList}>
                {confirmedCloths.map((c) => (
                  <li key={c.id} className={styles.pendingChip}>
                    {c.image ? (
                      <Image
                        src={getImgSrc(c.image) ?? ''}
                        alt={c.title}
                        width={20}
                        height={20}
                        className={styles.pendingChipImage}
                        unoptimized
                      />
                    ) : null}
                    <span className={styles.pendingChipTitle}>{c.title}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className={styles.clearAttachBtn}
                onClick={clearAttachments}
                disabled={isLoading}
              >
                Сбросить
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

    </form>
  );
}
