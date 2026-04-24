'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import formStyles from '@/shared/styles/form.module.css';
import { Card } from '@/shared/ui';
import { resolveAssetUrl, uploadBodyPhoto } from '@/shared/lib/uploadApi';

import styles from './Measurements.module.css';

type MetricItemProps = {
  label: string;
  name: string;
  placeholder: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  type?: string;
  value: string;
  onChange: (name: string, value: string) => void;
};

function MetricItem({
  label,
  name,
  placeholder,
  inputMode,
  type,
  value,
  onChange,
}: MetricItemProps): React.JSX.Element {
  const { t } = useTranslation();
  const isLegRatio = name === 'legRatio';
  return (
    <div className={styles.metric}>
      <label className={styles.metricLabel} htmlFor={`metric-${name}`}>
        {label}
      </label>
      {isLegRatio ? (
        // Для "пропорций ног" используем фиксированный набор вариантов.
        <select
          id={`metric-${name}`}
          className={`${formStyles.input} ${styles.metricInput}`}
          name={name}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
        >
          <option value="">{t('profile.measurements.notSelected')}</option>
          <option value="standard">{t('profile.measurements.legRatio.standard')}</option>
          <option value="long">{t('profile.measurements.legRatio.long')}</option>
          <option value="short">{t('profile.measurements.legRatio.short')}</option>
        </select>
      ) : (
        <input
          id={`metric-${name}`}
          className={`${formStyles.input} ${styles.metricInput}`}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          type={type ?? 'text'}
          inputMode={inputMode}
          // Числовые значения не могут быть отрицательными.
          min={type === 'number' ? 0 : undefined}
          step={type === 'number' ? 'any' : undefined}
        />
      )}
    </div>
  );
}

type MeasurementsProps = {
  bodyPhoto: string | null;
  chestCm: string;
  waistCm: string;
  hipsCm: string;
  heightCm: string;
  footCm: string;
  legRatio: 'standard' | 'long' | 'short' | null;
  onBodyPhotoChange: (next: string | null) => void;
  onFieldChange: (
    field: 'chestCm' | 'waistCm' | 'hipsCm' | 'heightCm' | 'footCm' | 'legRatio',
    value: string,
  ) => void;
};

export function Measurements({
  bodyPhoto,
  chestCm,
  waistCm,
  hipsCm,
  heightCm,
  footCm,
  legRatio,
  onBodyPhotoChange,
  onFieldChange,
}: MeasurementsProps): React.JSX.Element {
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const metrics: Array<Omit<MetricItemProps, 'value' | 'onChange'>> = [
    {
      label: t('profile.measurements.metrics.chest'),
      name: 'chestCm',
      placeholder: t('profile.measurements.placeholders.chest'),
      type: 'number',
      inputMode: 'numeric',
    },
    {
      label: t('profile.measurements.metrics.waist'),
      name: 'waistCm',
      placeholder: t('profile.measurements.placeholders.waist'),
      type: 'number',
      inputMode: 'numeric',
    },
    {
      label: t('profile.measurements.metrics.hips'),
      name: 'hipsCm',
      placeholder: t('profile.measurements.placeholders.hips'),
      type: 'number',
      inputMode: 'numeric',
    },
    {
      label: t('profile.measurements.metrics.height'),
      name: 'heightCm',
      placeholder: t('profile.measurements.placeholders.height'),
      type: 'number',
      inputMode: 'numeric',
    },
    {
      label: t('profile.measurements.metrics.foot'),
      name: 'footCm',
      placeholder: t('profile.measurements.placeholders.foot'),
      type: 'number',
      inputMode: 'decimal',
    },
    {
      label: t('profile.measurements.metrics.legRatio'),
      name: 'legRatio',
      placeholder: t('profile.measurements.placeholders.legRatio'),
    },
  ];

  const valuesByName: Record<string, string> = {
    chestCm,
    waistCm,
    hipsCm,
    heightCm,
    footCm,
    legRatio: legRatio ?? '',
  };

  return (
    <Card
      title={t('profile.measurements.title')}
      description={t('profile.measurements.description')}
    >
      <div className={styles.layout}>
        <div className={styles.photoCard} aria-label={t('profile.measurements.fullBodyPhoto')}>
          {bodyPhoto ? (
            <img
              className={styles.photoPreview}
              src={resolveAssetUrl(bodyPhoto)}
              alt={t('profile.measurements.fullBodyPhoto')}
            />
          ) : (
            <div className={styles.photoIcon} aria-hidden="true" />
          )}
          <div className={styles.photoText}>
            <p className={styles.photoTitle}>{t('profile.measurements.fullBodyPhoto')}</p>
            {!bodyPhoto ? (
              <p className={styles.photoHint}>{t('profile.measurements.photoHint')}</p>
            ) : null}
          </div>
          <label className={styles.uploadBtn} htmlFor="profile-fullbody-photo">
            {isUploading ? t('profile.measurements.uploading') : t('profile.measurements.upload')}
          </label>
          <input
            id="profile-fullbody-photo"
            className={styles.fileInput}
            type="file"
            accept="image/*"
            disabled={isUploading}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) {
                onBodyPhotoChange(null);
                return;
              }

              setIsUploading(true);
              setUploadError(null);
              try {
                const uploaded = await uploadBodyPhoto(file);
                onBodyPhotoChange(uploaded.url);
              } catch {
                setUploadError(t('profile.measurements.uploadFailed'));
              } finally {
                setIsUploading(false);
                e.target.value = '';
              }
            }}
          />
          {uploadError ? (
            <div className={styles.photoText}>
              <p className={styles.photoHint}>{uploadError}</p>
            </div>
          ) : null}
        </div>

        <div className={styles.metrics}>
          {metrics.map((m) => (
            <MetricItem
              key={m.name}
              {...m}
              value={valuesByName[m.name] ?? ''}
              onChange={(name, value) => {
                onFieldChange(
                  name as 'chestCm' | 'waistCm' | 'hipsCm' | 'heightCm' | 'footCm' | 'legRatio',
                  value,
                );
              }}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}

