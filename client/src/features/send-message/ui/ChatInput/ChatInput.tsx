"use client"

import { useState, type FormEvent, type KeyboardEvent } from "react"
import { ArrowUpIcon, PaperclipIcon, ImageIcon } from "@/shared/ui"
import styles from './ChatInput.module.css'

interface ChatInputProps {
  onSend: (message: string) => void
  isLoading?: boolean
  placeholder?: string
}

export function ChatInput({ 
  onSend, 
  isLoading,
  placeholder = "Спросите о стиле, гардеробе или модных трендах..." 
}: ChatInputProps) {
  const [input, setInput] = useState("")

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      onSend(input.trim())
      setInput("")
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.inputWrapper}>
        <div className={styles.attachButtons}>
          <button
            type="button"
            className={styles.attachButton}
            aria-label="Прикрепить файл"
          >
            <PaperclipIcon />
          </button>
          <button
            type="button"
            className={styles.attachButton}
            aria-label="Добавить изображение"
          >
            <ImageIcon />
          </button>
        </div>
        
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className={styles.textarea}
          disabled={isLoading}
        />
        
        <div className={styles.submitWrapper}>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`${styles.submitButton} ${
              input.trim() && !isLoading 
                ? styles.submitButtonActive 
                : styles.submitButtonDisabled
            }`}
            aria-label="Отправить сообщение"
          >
            <ArrowUpIcon />
          </button>
        </div>
      </div>
      
      <p className={styles.hint}>
        AI Wardrobe помогает подобрать идеальный образ
      </p>
    </form>
  )
}