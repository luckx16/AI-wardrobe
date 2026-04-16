import React from 'react';

import formStyles from '@/shared/styles/form.module.css';
import { Card } from '@/shared/ui';

import styles from './PersonalData.module.css';

type PersonalDataProps = {
  name: string;
  onNameChange: (next: string) => void;
  age: string;
  onAgeChange: (next: string) => void;
  portraitPhotoUrl: string;
  onPortraitPhotoSelect: (file: File) => void | Promise<void>;
  onLoad: () => void | Promise<void>;
  isBusy: boolean;
};

export function PersonalData({
  name,
  onNameChange,
  age,
  onAgeChange,
  portraitPhotoUrl,
  onPortraitPhotoSelect,
  onLoad,
  isBusy,
}: PersonalDataProps): React.JSX.Element {
  return (
    <Card
      title="Личные данные"
      description="Заполните данные — это поможет точнее подбирать рекомендации."
    >
      <div className={styles.grid}>
        <div className={styles.infoCard}>
          <div className={styles.subTitle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Основное</span>
            <button
              type="button"
              className={formStyles.btnGhost}
              onClick={() => onLoad()}
              disabled={isBusy}
            >
              Загрузить из профиля
            </button>
          </div>
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
              disabled={isBusy}
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
              value={age}
              onChange={(e) => onAgeChange(e.target.value)}
              min={0}
              inputMode="numeric"
              disabled={isBusy}
            />
          </div>
        </div>

        <div className={styles.photoUpload}>
          <div className={styles.photoDrop} aria-label="Загрузка портретного фото">
            <p className={styles.photoTitle}>Портретное фото</p>
            <p className={styles.photoHint}>Вам необходимо сделать фото при естественном освещении (для этого можно встать у окна) без макияжа и других изменений. Рекомендуемые параметры фото: JPG/PNG до 10MB, квадрат</p>
            {portraitPhotoUrl ? (
              <a className={styles.photoHint} href={portraitPhotoUrl} target="_blank" rel="noreferrer">
                Открыть загруженное фото
              </a>
            ) : null}
            <label className={styles.fileLabel} htmlFor="profile-photo">
              Выбрать файл
            </label>
            <input
              id="profile-photo"
              className={styles.fileInput}
              type="file"
              accept="image/*"
              disabled={isBusy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                void onPortraitPhotoSelect(file);
                e.target.value = '';
              }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

