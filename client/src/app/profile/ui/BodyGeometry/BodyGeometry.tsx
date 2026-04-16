import React from 'react';

import formStyles from '@/shared/styles/form.module.css';
import { Card } from '@/shared/ui';

import styles from './BodyGeometry.module.css';

type Metric = {
  label: string;
  name: string;
  placeholder: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  type?: string;
};

function MetricItem({ label, name, placeholder, inputMode, type }: Metric): React.JSX.Element {
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
          defaultValue=""
        >
          <option value="">Не выбрано</option>
          <option value="standard">Стандартные</option>
          <option value="long">Длинные</option>
          <option value="short">Короткие</option>
        </select>
      ) : (
        <input
          id={`metric-${name}`}
          className={`${formStyles.input} ${styles.metricInput}`}
          name={name}
          placeholder={placeholder}
          defaultValue=""
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

export function BodyGeometry(): React.JSX.Element {
  const metrics: Metric[] = [
    { label: 'Обхват груди (см)', name: 'chestCm', placeholder: 'Например: 92', type: 'number', inputMode: 'numeric' },
    { label: 'Обхват талии (см)', name: 'waistCm', placeholder: 'Например: 74', type: 'number', inputMode: 'numeric' },
    { label: 'Обхват бёдер (см)', name: 'hipsCm', placeholder: 'Например: 98', type: 'number', inputMode: 'numeric' },
    { label: 'Рост (см)', name: 'heightCm', placeholder: 'Например: 174', type: 'number', inputMode: 'numeric' },
    { label: 'Длина стопы (см)', name: 'footCm', placeholder: 'Например: 25.5', type: 'number', inputMode: 'decimal' },
    { label: 'Пропорции ног', name: 'legRatio', placeholder: 'Например: стандартные' },
  ];

  return (
    <Card title="Измерения" description="Замеры и пропорции для более точных рекомендаций.">
      <div className={styles.layout}>
        <div className={styles.photoCard} aria-label="Фото в полный рост">
          <div className={styles.photoIcon} aria-hidden="true" />
          <div className={styles.photoText}>
            <p className={styles.photoTitle}>Фото в полный рост</p>
            <p className={styles.photoHint}>Помогает точнее определить особенности фигуры.</p>
          </div>
          <label className={styles.uploadBtn} htmlFor="profile-fullbody-photo">
            Загрузить
          </label>
          <input id="profile-fullbody-photo" className={styles.fileInput} type="file" accept="image/*" />
        </div>

        <div className={styles.metrics}>
          {metrics.map((m) => (
            <MetricItem key={m.name} {...m} />
          ))}
        </div>
      </div>
    </Card>
  );
}

