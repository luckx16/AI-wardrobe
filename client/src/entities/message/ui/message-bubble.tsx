"use client"

import { SparklesIcon, UserIcon } from "@/shared/ui"

import styles from './MessageBubble.module.css'

export interface MessageBubbleProps {
  role: "user" | "assistant"
  content: string
  isLoading?: boolean
}

export function MessageBubble({ role, content, isLoading }: MessageBubbleProps) {
  const isAssistant = role === "assistant"

  return (
    <div className={`${styles.container} ${isAssistant ? styles.containerAssistant : styles.containerUser}`}>
      <div className={`${styles.avatar} ${isAssistant ? styles.avatarAssistant : styles.avatarUser}`}>
        {isAssistant ? (
          <SparklesIcon />
        ) : (
          <UserIcon />
        )}
      </div>
      
      <div className={`${styles.content} ${isAssistant ? styles.contentAssistant : styles.contentUser}`}>
        <span className={styles.label}>
          {isAssistant ? "AI Стилист" : "Вы"}
        </span>
        
        <div className={`${styles.bubble} ${isAssistant ? styles.bubbleAssistant : styles.bubbleUser}`}>
          {isLoading ? (
            <div className={styles.loading}>
              <span className={styles.loadingDot} />
              <span className={styles.loadingDot} />
              <span className={styles.loadingDot} />
            </div>
          ) : (
            content
          )}
        </div>
      </div>
    </div>
  )
}