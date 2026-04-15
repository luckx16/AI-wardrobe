"use client"

import { SparklesIcon, HistoryIcon, SettingsIcon, ChevronDownIcon } from "@/shared/ui"
import styles from './ChatHeader.module.css'

export function ChatHeader() {
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

        <button className={styles.modelSelector}>
          <span className={styles.statusDot} />
          <span>Style AI v2</span>
          <ChevronDownIcon className={styles.chevronIcon} />
        </button>

        <div className={styles.actions}>
          <button className={styles.actionButton} aria-label="История чатов">
            <HistoryIcon className={styles.actionIcon} />
          </button>
          <button className={styles.actionButton} aria-label="Настройки">
            <SettingsIcon className={styles.actionIcon} />
          </button>
        </div>
      </div>
    </header>
  )
}