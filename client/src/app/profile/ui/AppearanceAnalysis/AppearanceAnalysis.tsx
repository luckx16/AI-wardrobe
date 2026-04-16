'use client';

import React, { useMemo } from 'react';

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
  const contrastOptions = useMemo(
    () =>
      [
        { value: 'low', label: 'Низкий' },
        { value: 'medium', label: 'Средний' },
        { value: 'high', label: 'Высокий' },
      ] as const,
    [],
  );

  const undertoneOptions = useMemo(
    () =>
      [
        { value: 'cool', label: 'Холодный' },
        { value: 'warm', label: 'Тёплый' },
        { value: 'neutral', label: 'Нейтральный' },
      ] as const,
    [],
  );

  return (
    <Card
      title="Анализ внешности"
      description="Установите параметры — они помогут подобрать более гармоничные образы."
    >
      <div className={styles.grid}>
        <div className={styles.row}>
          <div className={styles.meta}>
            <p className={styles.label}>Уровень контраста</p>
          </div>
          {/* Линейный выбор с движимой плашкой (segmented control). */}
          <SegmentedControl
            ariaLabel="Уровень контраста"
            value={contrast ?? 'medium'}
            options={contrastOptions}
            onChange={onContrastChange}
            className={styles.segmented}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.meta}>
            <p className={styles.label}>Подтон кожи</p>
          </div>
          {/* Линейный выбор с движимой плашкой (segmented control). */}
          <SegmentedControl
            ariaLabel="Подтон кожи"
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

