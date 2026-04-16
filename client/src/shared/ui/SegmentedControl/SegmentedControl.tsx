'use client';

import React from 'react';

import styles from './SegmentedControl.module.css';

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  ariaLabel: string;
  value: T;
  options: ReadonlyArray<SegmentedOption<T>>;
  onChange: (next: T) => void;
  className?: string;
};

export function SegmentedControl<T extends string>({
  ariaLabel,
  value,
  options,
  onChange,
  className,
}: SegmentedControlProps<T>): React.JSX.Element {
  // Индекс активной опции нужен для CSS-переменных, которые двигают "плашку" под выбранный сегмент.
  const activeIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );

  return (
    <div
      className={`${styles.root}${className ? ` ${className}` : ''}`}
      role="group"
      aria-label={ariaLabel}
      style={
        {
          // CSS-переменные используются в `.indicator` для ширины/смещения.
          ['--seg-count' as string]: options.length,
          ['--seg-index' as string]: activeIndex,
        } as React.CSSProperties
      }
    >
      <span className={styles.indicator} aria-hidden="true" />
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            className={`${styles.btn}${isActive ? ` ${styles.active}` : ''}`}
            aria-pressed={isActive}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

