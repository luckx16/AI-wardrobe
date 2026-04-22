'use client';

import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

import { HistoryIcon, SettingsIcon, SparklesIcon } from '@/shared/ui';

import styles from './ChatHeader.module.css';

interface ChatHeaderProps {
  onToggleHistory?: () => void;
}

export function ChatHeader({ onToggleHistory }: ChatHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logoWrapper}>
          <div className={styles.iconBox}>
            <SparklesIcon className={styles.sparklesIcon} />
          </div>
          <div>
            <h1 className={clsx(styles.title, 'pageTitle')}>AI</h1>{' '}
            <p className={clsx(styles.subtitle, 'pageSubtitle')}>{t('chat.personalStylist')}</p>
          </div>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.actionButton}
            aria-label={t('chat.history')}
            type="button"
            onClick={onToggleHistory}
          >
            <HistoryIcon className={styles.actionIcon} />
          </button>
          <button className={styles.actionButton} aria-label={t('chat.settings')} type="button">
            <SettingsIcon className={styles.actionIcon} />
          </button>
        </div>
      </div>
    </header>
  );
}
