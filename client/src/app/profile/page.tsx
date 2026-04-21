'use client';

import React, { useEffect, useMemo, useState } from 'react';

import { useAppSelector } from '@/shared/hooks';
import type { ProfileDto } from '@/shared/lib/profileApi';
import { getProfile, upsertProfile } from '@/shared/lib/profileApi';
import { SidebarNav } from '@/shared/ui';

import styles from './profilePage.module.css';
import { AppearanceAnalysis } from './ui/AppearanceAnalysis/AppearanceAnalysis';
import { Measurements } from './ui/Measurements/Measurements';
import { PersonalData } from './ui/PersonalData/PersonalData';
import { StylePreferences } from './ui/StylePreferences/StylePreferences';

type Contrast = 'low' | 'medium' | 'high';
type Undertone = 'cool' | 'warm' | 'neutral';
type LegRatio = 'standard' | 'long' | 'short';
type Chip = { id: string; text: string };

type ProfileFormState = {
  contrast: Contrast | null;
  undertone: Undertone | null;
  portraitPhoto: string | null;
  bodyPhoto: string | null;
  heightCm: string;
  waistCm: string;
  chestCm: string;
  hipsCm: string;
  footCm: string;
  legRatio: LegRatio | null;
  wishes: string;
  prefs: Chip[];
  dislikes: Chip[];
  additions: Chip[];
};

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value) && value.every((x) => typeof x === 'string')) return value;
  if (value && typeof value === 'object' && Array.isArray((value as { items?: unknown }).items)) {
    const items = (value as { items: unknown[] }).items;
    if (items.every((x) => typeof x === 'string')) return items as string[];
  }
  return [];
}

function numOrNull(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function toChipArray(value: unknown): Chip[] {
  const strings = asStringArray(value);
  return strings.map((text) => ({
    id: `srv-${text}-${Math.random().toString(16).slice(2)}`,
    text,
  }));
}

function chipTexts(chips: Chip[]): string[] {
  return chips.map((c) => c.text);
}

function formFromDto(dto: ProfileDto): ProfileFormState {
  return {
    contrast: dto.contrast,
    undertone: dto.skin_tone,
    portraitPhoto: dto.portrait_photo,
    bodyPhoto: dto.body_photo,
    heightCm: dto.height == null ? '' : String(dto.height),
    waistCm: dto.waist == null ? '' : String(dto.waist),
    chestCm: dto.bust == null ? '' : String(dto.bust),
    hipsCm: dto.hips == null ? '' : String(dto.hips),
    footCm: dto.foot_length == null ? '' : String(dto.foot_length),
    legRatio: dto.proportion,
    wishes: dto.wishes ?? '',
    prefs: toChipArray(dto.prefs),
    dislikes: toChipArray(dto.dislikes),
    additions: toChipArray(
      (dto.additions ?? '')
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  };
}

export default function ProfilePage(): React.JSX.Element {
  // Имя берём из стора, но даём редактировать локально (пока без сохранения на сервер).
  const user = useAppSelector((state) => state.user.user);
  const [displayName, setDisplayName] = useState<string>(user?.name ?? '');

  useEffect(() => {
    setDisplayName(user?.name ?? '');
  }, [user?.name]);

  const [form, setForm] = useState<ProfileFormState>({
    contrast: null,
    undertone: null,
    portraitPhoto: null,
    bodyPhoto: null,
    heightCm: '',
    waistCm: '',
    chestCm: '',
    hipsCm: '',
    footCm: '',
    legRatio: null,
    wishes: '',
    prefs: [],
    dislikes: [],
    additions: [],
  });
  const [lastLoaded, setLastLoaded] = useState<ProfileFormState | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Нужен для подсветки активного пункта навигации при клике по якорям.
  const [activeSection, setActiveSection] = useState<
    'personal' | 'appearance' | 'measurements' | 'style'
  >('personal');

  useEffect(() => {
    let cancelled = false;
    async function load(): Promise<void> {
      setIsLoading(true);
      setError(null);
      try {
        const dto = await getProfile();
        if (cancelled) return;
        const next = formFromDto(dto);
        setForm(next);
        setLastLoaded(next);
      } catch (e) {
        if (cancelled) return;
        // Если профиля нет — это нормальный сценарий (первый вход).
        const status = (e as { response?: { status?: number } }).response?.status;
        if (status !== 404) setError('Не удалось загрузить профиль');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    if (user) void load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const navItems = useMemo(
    () => [
      // Якорные ссылки на секции страницы. Подсветка управляется `activeSection`.
      {
        key: 'personal',
        label: 'Личные данные',
        href: '#personal',
        active: activeSection === 'personal',
      },
      {
        key: 'appearance',
        label: 'Анализ внешности',
        href: '#appearance',
        active: activeSection === 'appearance',
      },
      {
        key: 'measurements',
        label: 'Измерения',
        href: '#measurements',
        active: activeSection === 'measurements',
      },
      { key: 'style', label: 'Предпочтения', href: '#style', active: activeSection === 'style' },
    ],
    [activeSection],
  );

  const canSave = !!user && !isSaving && !isLoading;

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHead}>
            <div className={styles.userAvatar} aria-hidden="true" />
            <div>
              <p className={styles.userName}>{displayName || 'Пользователь'}</p>
              <p className={styles.userSub}>Это ваш профиль</p>
            </div>
          </div>

          <SidebarNav
            title="Навигация"
            items={navItems}
            // Для якорей используем штатный переход по `href`, а тут — только подсветка активного пункта.
            onItemClick={(key) => setActiveSection(key as typeof activeSection)}
          />
        </aside>

        <section className={styles.main} aria-label="Профиль">
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Профиль</h1>
          </div>

          {error ? <p className={styles.userSub}>{error}</p> : null}

          <div className={styles.stack}>
            <section id="personal" className={styles.anchorSection} aria-label="Личные данные">
              <PersonalData
                name={displayName}
                onNameChange={setDisplayName}
                portraitPhoto={form.portraitPhoto}
                onPortraitPhotoChange={(next) =>
                  setForm((prev) => ({ ...prev, portraitPhoto: next }))
                }
              />
            </section>
            <section id="appearance" className={styles.anchorSection} aria-label="Анализ внешности">
              <AppearanceAnalysis
                contrast={form.contrast}
                undertone={form.undertone}
                onContrastChange={(next) => setForm((prev) => ({ ...prev, contrast: next }))}
                onUndertoneChange={(next) => setForm((prev) => ({ ...prev, undertone: next }))}
              />
            </section>
            <section id="measurements" className={styles.anchorSection} aria-label="Измерения">
              <Measurements
                bodyPhoto={form.bodyPhoto}
                chestCm={form.chestCm}
                waistCm={form.waistCm}
                hipsCm={form.hipsCm}
                heightCm={form.heightCm}
                footCm={form.footCm}
                legRatio={form.legRatio}
                onBodyPhotoChange={(next) => setForm((prev) => ({ ...prev, bodyPhoto: next }))}
                onFieldChange={(field, value) =>
                  setForm((prev) => ({
                    ...prev,
                    ...(field === 'chestCm' ? { chestCm: value } : {}),
                    ...(field === 'waistCm' ? { waistCm: value } : {}),
                    ...(field === 'hipsCm' ? { hipsCm: value } : {}),
                    ...(field === 'heightCm' ? { heightCm: value } : {}),
                    ...(field === 'footCm' ? { footCm: value } : {}),
                    ...(field === 'legRatio'
                      ? { legRatio: (value || null) as LegRatio | null }
                      : {}),
                  }))
                }
              />
            </section>
            <section id="style" className={styles.anchorSection} aria-label="Предпочтения">
              <StylePreferences
                wishes={form.wishes}
                prefs={form.prefs}
                dislikes={form.dislikes}
                additions={form.additions}
                onWishesChange={(next) => setForm((prev) => ({ ...prev, wishes: next }))}
                onPrefsChange={(next) => setForm((prev) => ({ ...prev, prefs: next }))}
                onDislikesChange={(next) => setForm((prev) => ({ ...prev, dislikes: next }))}
                onAdditionsChange={(next) => setForm((prev) => ({ ...prev, additions: next }))}
              />
            </section>
          </div>

          <div className={styles.footerActions}>
            <button
              type="button"
              className={styles.secondaryBtn}
              disabled={!lastLoaded || isSaving || isLoading}
              onClick={() => {
                if (!lastLoaded) return;
                setForm(lastLoaded);
                setError(null);
              }}
            >
              Отменить
            </button>
            <button
              type="button"
              className={styles.primaryBtn}
              disabled={!canSave}
              onClick={async () => {
                if (!user) return;
                setIsSaving(true);
                setError(null);
                try {
                  const dto = await upsertProfile({
                    skin_tone: form.undertone,
                    contrast: form.contrast,
                    portrait_photo: form.portraitPhoto,
                    body_photo: form.bodyPhoto,
                    height: numOrNull(form.heightCm),
                    waist: numOrNull(form.waistCm),
                    bust: numOrNull(form.chestCm),
                    hips: numOrNull(form.hipsCm),
                    foot_length: numOrNull(form.footCm),
                    proportion: form.legRatio,
                    wishes: form.wishes.trim() ? form.wishes : null,
                    prefs: chipTexts(form.prefs),
                    dislikes: chipTexts(form.dislikes),
                    additions: form.additions.length ? chipTexts(form.additions).join('\n') : null,
                  });
                  const next = formFromDto(dto);
                  setForm(next);
                  setLastLoaded(next);
                } catch {
                  setError('Не удалось сохранить профиль');
                } finally {
                  setIsSaving(false);
                }
              }}
            >
              {isSaving ? 'Сохранение…' : 'Сохранить'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
