'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { SidebarNav } from '@/shared/ui';
import { useAppSelector } from '@/shared/hooks';
import { axiosInstance } from '@/shared/lib/axiosInstance';

import { AppearanceAnalysis } from './ui/AppearanceAnalysis/AppearanceAnalysis';
import { Measurements } from './ui/Measurements/Measurements';
import { PersonalData } from './ui/PersonalData/PersonalData';
import { Preferences } from './ui/Preferences/Preferences';

import styles from './profilePage.module.css';

type Contrast = 'low' | 'medium' | 'high';
type ProfileApiShape = {
  id?: number;
  user_id?: number;
  skin_tone?: string | null;
  contrast?: Contrast | null;
  portrait_photo?: string | null;
  body_photo?: string | null;
  height?: number | null;
  waist?: number | null;
  bust?: number | null;
  hips?: number | null;
  foot_length?: number | null;
  proportion?: string | null;
  wishes?: string | null;
  prefs?: Record<string, unknown> | null;
  dislikes?: Record<string, unknown> | null;
  additions?: string | null;
};

type ProfileDraft = {
  fullName: string;
  age: string;
  portraitPhotoUrl: string;
  bodyPhotoUrl: string;

  contrast: Contrast;
  undertone: 'cool' | 'warm' | 'neutral';

  measurements: {
    bustCm: string;
    waistCm: string;
    hipsCm: string;
    heightCm: string;
    footCm: string;
    legRatio: '' | 'standard' | 'long' | 'short';
  };

  preferences: {
    wishes: string;
    essentials: string[];
    noGo: string[];
    additions: string;
  };
};

function toNumberOrNull(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function getStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
}

function extractProfilePayload(resData: unknown): ProfileApiShape | null {
  if (!resData || typeof resData !== 'object') return null;
  const obj = resData as Record<string, unknown>;
  if (obj.data && typeof obj.data === 'object') return obj.data as ProfileApiShape;
  return obj as ProfileApiShape;
}

function mapApiToDraft(api: ProfileApiShape | null, fallbackName: string): ProfileDraft {
  const prefs = (api?.prefs ?? {}) as Record<string, unknown>;
  const dislikes = (api?.dislikes ?? {}) as Record<string, unknown>;

  return {
    fullName: fallbackName,
    age: '',
    portraitPhotoUrl: api?.portrait_photo ?? '',
    bodyPhotoUrl: api?.body_photo ?? '',

    contrast: api?.contrast ?? 'medium',
    undertone: (prefs.undertone as ProfileDraft['undertone']) ?? 'neutral',

    measurements: {
      bustCm: api?.bust != null ? String(api.bust) : '',
      waistCm: api?.waist != null ? String(api.waist) : '',
      hipsCm: api?.hips != null ? String(api.hips) : '',
      heightCm: api?.height != null ? String(api.height) : '',
      footCm: api?.foot_length != null ? String(api.foot_length) : '',
      legRatio: (prefs.legRatio as ProfileDraft['measurements']['legRatio']) ?? '',
    },

    preferences: {
      wishes: api?.wishes ?? '',
      essentials: getStringArray(prefs.essentials),
      noGo: getStringArray(dislikes.noGo),
      additions: api?.additions ?? '',
    },
  };
}

function buildUpsertPayload(draft: ProfileDraft): Partial<ProfileApiShape> {
  return {
    contrast: draft.contrast,
    portrait_photo: draft.portraitPhotoUrl || null,
    body_photo: draft.bodyPhotoUrl || null,
    height: toNumberOrNull(draft.measurements.heightCm),
    waist: toNumberOrNull(draft.measurements.waistCm),
    bust: toNumberOrNull(draft.measurements.bustCm),
    hips: toNumberOrNull(draft.measurements.hipsCm),
    foot_length: toNumberOrNull(draft.measurements.footCm),
    wishes: draft.preferences.wishes || null,
    additions: draft.preferences.additions || null,
    prefs: {
      essentials: draft.preferences.essentials,
      undertone: draft.undertone,
      legRatio: draft.measurements.legRatio || null,
    },
    dislikes: {
      noGo: draft.preferences.noGo,
    },
  };
}

export default function ProfilePage(): React.JSX.Element {
  // Имя берём из стора, но даём редактировать локально (пока без сохранения на сервер).
  const user = useAppSelector((state) => state.user.user);
  const userName = user?.name ?? '';
  const [displayName, setDisplayName] = useState<string>(userName);

  // Нужен для подсветки активного пункта навигации при клике по якорям.
  const [activeSection, setActiveSection] = useState<'personal' | 'appearance' | 'measurements' | 'prefs'>(
    'personal',
  );

  const initialDraftRef = useRef<ProfileDraft | null>(null);
  const [draft, setDraft] = useState<ProfileDraft>(() => mapApiToDraft(null, userName));
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'error'>('idle');
  const [errorText, setErrorText] = useState<string>('');

  const loadProfile = useCallback(async () => {
    setStatus('loading');
    setErrorText('');
    try {
      const { data } = await axiosInstance.get('/profile');
      const api = extractProfilePayload(data);
      const nextDraft = mapApiToDraft(api, userName);
      // Имя пользователя для UI берём из Redux, но разрешаем локально менять.
      nextDraft.fullName = displayName || userName;
      setDraft(nextDraft);
      initialDraftRef.current = nextDraft;
      setStatus('idle');
    } catch (e: unknown) {
      // 404 = профиля нет — это нормальный сценарий: оставляем пустой драфт.
      const anyErr = e as { response?: { status?: number } };
      if (anyErr?.response?.status === 404) {
        const nextDraft = mapApiToDraft(null, userName);
        nextDraft.fullName = displayName || userName;
        setDraft(nextDraft);
        initialDraftRef.current = nextDraft;
        setStatus('idle');
        return;
      }
      setErrorText('Не удалось загрузить профиль. Проверьте авторизацию и доступность сервера.');
      setStatus('error');
    }
  }, [displayName, userName]);

  useEffect(() => {
    void loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveProfile = useCallback(async () => {
    setStatus('saving');
    setErrorText('');
    try {
      const payload = buildUpsertPayload(draft);
      const { data } = await axiosInstance.patch('/profile', payload);
      const api = extractProfilePayload(data);
      const nextDraft = mapApiToDraft(api, userName);
      nextDraft.fullName = draft.fullName;
      nextDraft.age = draft.age;
      setDraft(nextDraft);
      initialDraftRef.current = nextDraft;
      setStatus('idle');
    } catch (e: unknown) {
      setErrorText('Не удалось сохранить профиль. Попробуйте ещё раз.');
      setStatus('error');
    }
  }, [draft, userName]);

  const cancelChanges = useCallback(() => {
    const initial = initialDraftRef.current;
    if (initial) {
      setDraft(initial);
      setDisplayName(initial.fullName);
      return;
    }
    const empty = mapApiToDraft(null, userName);
    setDraft(empty);
    setDisplayName(empty.fullName);
  }, [userName]);

  const uploadPhoto = useCallback(
    async (kind: 'portrait' | 'body', file: File) => {
      const formData = new FormData();
      formData.append(kind === 'portrait' ? 'portrait_photo' : 'body_photo', file);
      const { data } = await axiosInstance.post(`/upload/${kind}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // uploadController возвращает { success, data: { url, field } }
      const url =
        (data && typeof data === 'object' && (data as any).data && (data as any).data.url) ||
        '';
      if (!url) return;
      setDraft((prev) => ({
        ...prev,
        portraitPhotoUrl: kind === 'portrait' ? url : prev.portraitPhotoUrl,
        bodyPhotoUrl: kind === 'body' ? url : prev.bodyPhotoUrl,
      }));
    },
    [],
  );

  const navItems = useMemo(
    () => [
      // Якорные ссылки на секции страницы. Подсветка управляется `activeSection`.
      { key: 'personal', label: 'Личные данные', href: '#personal', active: activeSection === 'personal' },
      { key: 'appearance', label: 'Анализ внешности', href: '#appearance', active: activeSection === 'appearance' },
      { key: 'measurements', label: 'Измерения', href: '#measurements', active: activeSection === 'measurements' },
      { key: 'prefs', label: 'Предпочтения', href: '#prefs', active: activeSection === 'prefs' },
    ],
    [activeSection],
  );

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
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={loadProfile}
              disabled={status === 'loading' || status === 'saving'}
            >
              Обновить
            </button>
          </div>

          {errorText ? (
            <p role="alert" className={styles.userSub}>
              {errorText}
            </p>
          ) : null}

          <div className={styles.stack}>
            <section id="personal" className={styles.anchorSection} aria-label="Личные данные">
              <PersonalData
                name={draft.fullName}
                age={draft.age}
                portraitPhotoUrl={draft.portraitPhotoUrl}
                isBusy={status === 'loading' || status === 'saving'}
                onLoad={loadProfile}
                onNameChange={(next) => {
                  setDisplayName(next);
                  setDraft((prev) => ({ ...prev, fullName: next }));
                }}
                onAgeChange={(next) => setDraft((prev) => ({ ...prev, age: next }))}
                onPortraitPhotoSelect={async (file) => uploadPhoto('portrait', file)}
              />
            </section>
            <section id="appearance" className={styles.anchorSection} aria-label="Анализ внешности">
              <AppearanceAnalysis
                contrast={draft.contrast}
                undertone={draft.undertone}
                disabled={status === 'loading' || status === 'saving'}
                onContrastChange={(next) => setDraft((prev) => ({ ...prev, contrast: next }))}
                onUndertoneChange={(next) => setDraft((prev) => ({ ...prev, undertone: next }))}
              />
            </section>
            <section id="measurements" className={styles.anchorSection} aria-label="Измерения">
              <Measurements
                value={draft.measurements}
                bodyPhotoUrl={draft.bodyPhotoUrl}
                disabled={status === 'loading' || status === 'saving'}
                onChange={(next) => setDraft((prev) => ({ ...prev, measurements: next }))}
                onBodyPhotoSelect={async (file) => uploadPhoto('body', file)}
              />
            </section>
            <section id="prefs" className={styles.anchorSection} aria-label="Предпочтения">
              <Preferences
                value={draft.preferences}
                disabled={status === 'loading' || status === 'saving'}
                onChange={(next) => setDraft((prev) => ({ ...prev, preferences: next }))}
              />
            </section>
          </div>

          <div className={styles.footerActions}>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={cancelChanges}
              disabled={status === 'loading' || status === 'saving'}
            >
              Отменить
            </button>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={saveProfile}
              disabled={status === 'loading' || status === 'saving'}
            >
              Сохранить
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

