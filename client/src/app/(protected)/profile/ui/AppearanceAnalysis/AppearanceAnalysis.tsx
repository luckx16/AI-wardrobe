'use client';

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Card, SegmentedControl } from '@/shared/ui';

import styles from './AppearanceAnalysis.module.css';

type Contrast = 'low' | 'medium' | 'high';
type Undertone = 'cool' | 'warm' | 'neutral';

type AppearanceAnalysisProps = {
  contrast: Contrast | null;
  undertone: Undertone | null;
  onContrastChange: (next: Contrast) => void;
  onUndertoneChange: (next: Undertone) => void;
};

export function AppearanceAnalysis({
  contrast,
  undertone,
  onContrastChange,
  onUndertoneChange,
}: AppearanceAnalysisProps): React.JSX.Element {
  const { t } = useTranslation();
  const contrastOptions = useMemo(
    () =>
      [
        { value: 'low', label: t('profile.appearance.contrast.low') },
        { value: 'medium', label: t('profile.appearance.contrast.medium') },
        { value: 'high', label: t('profile.appearance.contrast.high') },
      ] as const,
    [t],
  );

  const undertoneOptions = useMemo(
    () =>
      [
        { value: 'cool', label: t('profile.appearance.undertone.cool') },
        { value: 'warm', label: t('profile.appearance.undertone.warm') },
        { value: 'neutral', label: t('profile.appearance.undertone.neutral') },
      ] as const,
    [t],
  );

  return (
    <Card
      title={t('profile.appearance.title')}
      description={t('profile.appearance.description')}
    >
      <div className={styles.grid}>
        <div className={styles.row}>
          <div className={styles.meta}>
            <p className={styles.label}>{t('profile.appearance.contrastLabel')}</p>
          </div>
          {/* Линейный выбор с движимой плашкой (segmented control). */}
          <SegmentedControl
            ariaLabel={t('profile.appearance.contrastLabel')}
            value={contrast ?? 'medium'}
            options={contrastOptions}
            onChange={onContrastChange}
            className={styles.segmented}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.meta}>
            <p className={styles.label}>{t('profile.appearance.undertoneLabel')}</p>
          </div>
          {/* Линейный выбор с движимой плашкой (segmented control). */}
          <SegmentedControl
            ariaLabel={t('profile.appearance.undertoneLabel')}
            value={undertone ?? 'neutral'}
            options={undertoneOptions}
            onChange={onUndertoneChange}
            className={styles.segmented}
          />
        </div>
      </div>
    </Card>
  );
}

