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
  disabled?: boolean;
};

export function SegmentedControl<T extends string>({
  ariaLabel,
  value,
  options,
  onChange,
  className,
  disabled,
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
      aria-disabled={disabled || undefined}
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
            onClick={() => {
              if (disabled) return;
              onChange(opt.value);
            }}
            disabled={disabled}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

