'use client';

import React, { useMemo, useState } from 'react';

import { Card, SegmentedControl } from '@/shared/ui';

import styles from './AppearanceAnalysis.module.css';

type Contrast = 'low' | 'medium' | 'high';
type Undertone = 'cool' | 'warm' | 'neutral';

export function AppearanceAnalysis(): React.JSX.Element {
  // Здесь пока локальный UI-стейт (позже можно подключить к форме/стору).
  const [contrast, setContrast] = useState<Contrast>('medium');
  const [undertone, setUndertone] = useState<Undertone>('neutral');

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
            value={contrast}
            options={contrastOptions}
            onChange={setContrast}
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
            value={undertone}
            options={undertoneOptions}
            onChange={setUndertone}
            className={styles.segmented}
          />
        </div>
      </div>
    </Card>
  );
}

