'use client';

import { HistoryIcon, SettingsIcon, SparklesIcon } from '@/shared/ui';

import styles from './ChatHeader.module.css';

interface ChatHeaderProps {
  onToggleHistory?: () => void;
}

export function ChatHeader({ onToggleHistory }: ChatHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logoWrapper}>
          <div className={styles.iconBox}>
            <SparklesIcon className={styles.sparklesIcon} />
          </div>
          <div>
            <h1 className={styles.title}>AI Wardrobe</h1>
            <p className={styles.subtitle}>Персональный стилист</p>
          </div>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.actionButton}
            aria-label="История чатов"
            type="button"
            onClick={onToggleHistory}
          >
            <HistoryIcon className={styles.actionIcon} />
          </button>
          <button className={styles.actionButton} aria-label="Настройки" type="button">
            <SettingsIcon className={styles.actionIcon} />
          </button>
        </div>
      </div>
    </header>
  );
}
