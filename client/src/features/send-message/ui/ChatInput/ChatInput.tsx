"use client"

import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react"

import type { MessageClothChip } from "@/entities/message"
import { getCloths } from "@/features/outfit-builder/api/outfitBuilderApi"

import { ArrowUpIcon, ImageIcon, PaperclipIcon } from "@/shared/ui"

import styles from './ChatInput.module.css'

export type ChatSendOptions = {
  useWardrobe?: boolean
  createLook?: boolean
  clothIds?: number[]
  clothPreview?: MessageClothChip[]
}

interface ChatInputProps {
  onSend: (message: string, options?: ChatSendOptions) => void
  isLoading?: boolean
  wardrobeEnabled?: boolean
  placeholder?: string
}

export function ChatInput({
  onSend,
  isLoading,
  wardrobeEnabled = false,
  placeholder = "Спросите о стиле, гардеробе или модных трендах...",
}: ChatInputProps) {
  const [input, setInput] = useState("")
  const [createLook, setCreateLook] = useState(false)
  const [clothOptions, setClothOptions] = useState<
    { id: string; title: string; category: string | null; color: string | null }[]
  >([])
  const [attachOpen, setAttachOpen] = useState(false)
  const [pickerDraftIds, setPickerDraftIds] = useState<string[]>([])
  const [confirmedCloths, setConfirmedCloths] = useState<MessageClothChip[]>([])

  const lookId = useId()
  const attachMenuId = useId()
  const attachRootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!wardrobeEnabled) {
      setClothOptions([])
      return
    }
    let cancelled = false
    void getCloths()
      .then((rows) => {
        if (!cancelled) {
          setClothOptions(
            rows.map((c) => ({
              id: c.id,
              title: c.title,
              category: c.category,
              color: c.color,
            })),
          )
        }
      })
      .catch(() => {
        if (!cancelled) setClothOptions([])
      })
    return () => {
      cancelled = true
    }
  }, [wardrobeEnabled])

  useEffect(() => {
    if (!attachOpen) return
    const onDocMouseDown = (e: MouseEvent) => {
      const el = attachRootRef.current
      if (el && !el.contains(e.target as Node)) {
        setAttachOpen(false)
      }
    }
    document.addEventListener("mousedown", onDocMouseDown)
    return () => document.removeEventListener("mousedown", onDocMouseDown)
  }, [attachOpen])

  const openAttachPicker = () => {
    if (!clothOptions.length || isLoading) return
    setPickerDraftIds(confirmedCloths.map((c) => c.id))
    setAttachOpen(true)
  }

  const toggleDraft = (id: string) => {
    setPickerDraftIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const confirmAttach = () => {
    const next: MessageClothChip[] = clothOptions
      .filter((c) => pickerDraftIds.includes(c.id))
      .map((c) => ({
        id: c.id,
        title: c.title,
        category: c.category,
        color: c.color,
      }))
    setConfirmedCloths(next)
    setAttachOpen(false)
  }

  const clearAttachments = () => {
    setConfirmedCloths([])
    setPickerDraftIds([])
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      const useWardrobe = createLook || confirmedCloths.length > 0
      const clothIds = confirmedCloths
        .map((c) => Number(c.id))
        .filter((n) => Number.isFinite(n))

      onSend(input.trim(), {
        useWardrobe,
        createLook,
        clothIds: clothIds.length ? clothIds : undefined,
        clothPreview: confirmedCloths.length ? confirmedCloths : undefined,
      })
      setInput("")
      setConfirmedCloths([])
      setPickerDraftIds([])
      setAttachOpen(false)
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

      {wardrobeEnabled ? (
        <div className={styles.wardrobeBlock}>
          <div className={styles.wardrobeRow}>
            <label htmlFor={lookId} className={styles.optionLabel}>
              <input
                id={lookId}
                type="checkbox"
                checked={createLook}
                onChange={(e) => setCreateLook(e.target.checked)}
                disabled={isLoading}
                className={styles.optionCheckbox}
              />
              Создать лук
            </label>

            <div className={styles.attachWrap} ref={attachRootRef}>
              <button
                type="button"
                className={`${styles.attachClothesBtn} ${attachOpen ? styles.attachClothesBtnOpen : ""}`}
                onClick={() => (attachOpen ? setAttachOpen(false) : openAttachPicker())}
                disabled={isLoading || !clothOptions.length}
                aria-expanded={attachOpen}
                aria-controls={attachMenuId}
              >
                Прикрепить вещи к сообщению
              </button>

              {attachOpen ? (
                <div
                  id={attachMenuId}
                  className={styles.attachDropdown}
                  role="dialog"
                  aria-label="Выбор вещей из гардероба"
                >
                  <span className={styles.clothPickerLabel}>Гардероб</span>
                  <ul className={styles.clothList}>
                    {clothOptions.map((c) => (
                      <li key={c.id}>
                        <label className={styles.clothRow}>
                          <input
                            type="checkbox"
                            checked={pickerDraftIds.includes(c.id)}
                            onChange={() => toggleDraft(c.id)}
                            disabled={isLoading}
                          />
                          <span className={styles.clothRowText}>
                            <span className={styles.clothRowTitle}>{c.title}</span>
                            {[c.category, c.color].filter(Boolean).length > 0 ? (
                              <span className={styles.clothRowMeta}>
                                {[c.category, c.color].filter(Boolean).join(" · ")}
                              </span>
                            ) : null}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                  <div className={styles.attachDropdownFooter}>
                    <button
                      type="button"
                      className={styles.confirmAttachBtn}
                      onClick={confirmAttach}
                    >
                      Прикрепить
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {!clothOptions.length ? (
            <p className={styles.hintMuted}>В гардеробе пока нет обработанных вещей.</p>
          ) : null}

          {confirmedCloths.length > 0 ? (
            <div className={styles.pendingStrip}>
              <span className={styles.pendingStripLabel}>Прикреплённые вещи:</span>
              <ul className={styles.pendingList}>
                {confirmedCloths.map((c) => (
                  <li key={c.id} className={styles.pendingChip}>
                    {c.title}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className={styles.clearAttachBtn}
                onClick={clearAttachments}
                disabled={isLoading}
              >
                Сбросить
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <p className={styles.hint}>AI Wardrobe помогает подобрать идеальный образ</p>
    </form>
  )
}
