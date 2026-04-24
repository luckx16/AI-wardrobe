'use client';

import { Moon, Sun } from 'lucide-react';

import { useTheme } from '@/shared/hooks/useTheme';

import styles from './ThemeToggle.module.css';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className={styles.toggle}
      data-theme-state={theme}
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
    >
      <span className={styles.knob} aria-hidden>
        {theme === 'dark' ? <Moon className={styles.icon} /> : <Sun className={styles.icon} />}
      </span>
    </button>
  );
}
