'use client';

import React, { useState } from 'react';

import formStyles from '@/shared/styles/form.module.css';
import { Card } from '@/shared/ui';
import { resolveAssetUrl, uploadPortraitPhoto } from '@/shared/lib/uploadApi';

import styles from './PersonalData.module.css';

type PersonalDataProps = {
  name: string;
  onNameChange: (next: string) => void;
  portraitPhoto: string | null;
  onPortraitPhotoChange: (next: string | null) => void;
};

export function PersonalData({
  name,
  onNameChange,
  portraitPhoto,
  onPortraitPhotoChange,
}: PersonalDataProps): React.JSX.Element {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  return (
    <Card
      title="Личные данные"
      description="Заполните данные — это поможет точнее подбирать рекомендации."
    >
      <div className={styles.grid}>
        <div className={styles.infoCard}>
          <p className={styles.subTitle}>Основное</p>
          <div className={styles.field}>
            <label className={formStyles.label} htmlFor="profile-fullname">
              Имя и фамилия
            </label>
            <input
              id="profile-fullname"
              className={formStyles.input}
              type="text"
              name="fullName"
              placeholder="Например: Анна Иванова"
              // Управляемый инпут, чтобы имя сразу отображалось в сайдбаре.
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              autoComplete="name"
            />
          </div>
          <div className={styles.field}>
            <label className={formStyles.label} htmlFor="profile-age">
              Возраст
            </label>
            <input
              id="profile-age"
              className={formStyles.input}
              type="number"
              name="age"
              placeholder="Например: 28"
              defaultValue=""
              min={0}
              inputMode="numeric"
            />
          </div>
        </div>

        <div className={styles.photoUpload}>
          <div className={styles.photoDrop} aria-label="Загрузка портретного фото">
            <p className={styles.photoTitle}>Портретное фото</p>
            {!portraitPhoto ? (
              <p className={styles.photoHint}>
                Вам необходимо сделать фото при естественном освещении (для этого можно встать у окна) без макияжа и
                других изменений. Рекомендуемые параметры фото: JPG/PNG до 10MB, квадрат
              </p>
            ) : null}
            {portraitPhoto ? (
              <img
                className={styles.photoPreview}
                src={resolveAssetUrl(portraitPhoto)}
                alt="Портретное фото"
              />
            ) : null}
            <label className={styles.fileLabel} htmlFor="profile-photo">
              {isUploading ? 'Загрузка…' : 'Выбрать файл'}
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
                  const uploaded = await uploadPortraitPhoto(file);
                  onPortraitPhotoChange(uploaded.url);
                } catch {
                  setUploadError('Не удалось загрузить фото');
                } finally {
                  setIsUploading(false);
                  // Позволяем выбрать тот же файл повторно (после ошибки или повторной загрузки).
                  e.target.value = '';
                }
              }}
            />
            {uploadError ? <p className={styles.photoHint}>{uploadError}</p> : null}
            {portraitPhoto && !uploadError ? <p className={styles.photoHint}>Фото загружено</p> : null}
          </div>
        </div>
      </div>
    </Card>
  );
}

