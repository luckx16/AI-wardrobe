"use client"

import type React from 'react';
import Image from 'next/image';

import type { MessageClothChip } from '@/entities/message/model/types';
import { SparklesIcon, UserIcon } from "@/shared/ui"
import { getImgSrc } from '@/shared/lib/getImgSrc';

import styles from './MessageBubble.module.css'

export interface MessageBubbleProps {
  role: "user" | "assistant"
  content: React.ReactNode
  isLoading?: boolean
  cloths?: MessageClothChip[]
}

export function MessageBubble({ role, content, isLoading, cloths }: MessageBubbleProps) {
  const isAssistant = role === "assistant"
  const hasCloths = Boolean(cloths?.length)

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
        
        <div
          className={`${styles.messageStack} ${isAssistant ? styles.messageStackAssistant : styles.messageStackUser}`}
        >
          <div
            className={`${styles.bubble} ${isAssistant ? styles.bubbleAssistant : styles.bubbleUser} ${
              hasCloths && !isLoading ? styles.bubbleWithAttachment : ""
            }`}
          >
            {isLoading ? (
              <div className={styles.loading}>
                <span className={styles.loadingDot} />
                <span className={styles.loadingDot} />
                <span className={styles.loadingDot} />
              </div>
            ) : (
              <div>{content}</div>
            )}
          </div>
          {hasCloths && !isLoading ? (
            <div
              className={`${styles.attachmentStrip} ${
                isAssistant ? styles.attachmentStripAssistant : styles.attachmentStripUser
              }`}
              aria-label="Прикреплённые вещи"
            >
              <span className={styles.attachmentStripTitle}>Из гардероба</span>
              <ul className={styles.attachmentList}>
                {cloths!.map((c) => (
                  <li key={c.id} className={styles.attachmentCard}>
                    {c.image ? (
                      <Image
                        src={getImgSrc(c.image) ?? ''}
                        alt={c.title}
                        width={44}
                        height={44}
                        className={styles.attachmentImage}
                        unoptimized
                      />
                    ) : (
                      <span className={styles.attachmentFallback} aria-hidden="true" />
                    )}
                    <span className={styles.attachmentText}>
                      <span className={styles.attachmentTitle}>{c.title}</span>
                      {[c.category, c.color].filter(Boolean).length > 0 ? (
                        <span className={styles.attachmentMeta}>
                          {[c.category, c.color].filter(Boolean).join(" · ")}
                        </span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
