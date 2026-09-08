'use client';

import React, { useState } from 'react';

import { useTranslation } from 'react-i18next';

import { convertHeicIfNeeded } from '@/shared/lib/convertHeic';
import { resolveAssetUrl, uploadPortraitPhoto } from '@/shared/lib/uploadApi';
import formStyles from '@/shared/styles/form.module.css';
import { Card } from '@/shared/ui';

import styles from './PersonalData.module.css';

type PersonalDataProps = {
  name: string;
  onNameChange: (next: string) => void;
  age: string;
  onAgeChange: (next: string) => void;
  portraitPhoto: string | null;
  onPortraitPhotoChange: (next: string | null) => void;
};

export function PersonalData({
  name,
  onNameChange,
  age,
  onAgeChange,
  portraitPhoto,
  onPortraitPhotoChange,
}: PersonalDataProps): React.JSX.Element {
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  return (
    <Card title={t('profile.personal.title')} description={t('profile.personal.description')}>
      <div className={styles.grid}>
        <div className={styles.infoCard}>
          <p className={styles.subTitle}>{t('profile.personal.basic')}</p>
          <div className={styles.field}>
            <label className={formStyles.label} htmlFor="profile-fullname">
              {t('profile.personal.fullName')}
            </label>
            <input
              id="profile-fullname"
              className={formStyles.input}
              type="text"
              name="fullName"
              placeholder={t('profile.personal.fullNamePlaceholder')}
              // Управляемый инпут, чтобы имя сразу отображалось в сайдбаре.
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              autoComplete="name"
            />
          </div>
          <div className={styles.field}>
            <label className={formStyles.label} htmlFor="profile-age">
              {t('profile.personal.age')}
            </label>
            <input
              id="profile-age"
              className={formStyles.input}
              type="number"
              name="age"
              placeholder={t('profile.personal.agePlaceholder')}
              value={age}
              onChange={(e) => onAgeChange(e.target.value)}
              min={0}
              inputMode="numeric"
            />
          </div>
        </div>

        <div className={styles.photoUpload}>
          <div className={styles.photoDrop} aria-label={t('profile.personal.portraitUploadAria')}>
            <p className={styles.photoTitle}>{t('profile.personal.portraitPhoto')}</p>
            {!portraitPhoto ? (
              <p className={styles.photoHint}>{t('profile.personal.portraitHint')}</p>
            ) : null}
            {portraitPhoto ? (
              <img
                className={styles.photoPreview}
                src={resolveAssetUrl(portraitPhoto)}
                alt={t('profile.personal.portraitPhoto')}
              />
            ) : null}
            <label className={styles.fileLabel} htmlFor="profile-photo">
              {isUploading ? t('profile.personal.uploading') : t('profile.personal.chooseFile')}
            </label>
            <input
              id="profile-photo"
              className={styles.fileInput}
              type="file"
              accept="image/*"
              disabled={isUploading}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) {
                  onPortraitPhotoChange(null);
                  return;
                }

                setIsUploading(true);
                setUploadError(null);
                try {
                  // Снимки с айфона приходят в HEIC, а сервер их не декодирует и отдаёт как есть —
                  // на Windows и Android такое фото не отобразится. Конвертируем в браузере,
                  // так же как это делает форма добавления вещи.
                  const uploaded = await uploadPortraitPhoto(await convertHeicIfNeeded(file));
                  onPortraitPhotoChange(uploaded.url);
                } catch {
                  setUploadError(t('profile.personal.uploadFailed'));
                } finally {
                  setIsUploading(false);
                  // Позволяем выбрать тот же файл повторно (после ошибки или повторной загрузки).
                  e.target.value = '';
                }
              }}
            />
            {uploadError ? <p className={styles.photoHint}>{uploadError}</p> : null}
          </div>
        </div>
      </div>
    </Card>
  );
}
