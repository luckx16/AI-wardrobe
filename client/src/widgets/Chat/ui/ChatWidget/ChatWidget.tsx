"use client"

import { useEffect,useRef, useState } from "react"

import { type Message,MessageBubble } from "@/entities/message"
import { ChatInput, SuggestionChips } from "@/features/send-message"
import { ChatHeader } from "@/widgets"

import styles from './ChatWidget.module.css'

const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "Привет! Я ваш персональный AI-стилист. Расскажите о вашем стиле, предстоящем мероприятии или покажите фото гардероба — помогу создать идеальный образ!",
  },
]

const SAMPLE_RESPONSES = [
  "Отличный выбор! Для делового стиля рекомендую классический блейзер в нейтральных тонах — он отлично сочетается с джинсами и брюками. Хотите посмотреть варианты?",
  "Понимаю! Для casual-образа идеально подойдут базовые вещи: белая футболка, качественные джинсы и кроссовки. Это универсальная комбинация на каждый день.",
  "Интересная задача! Для этого мероприятия советую обратить внимание на элегантное платье-миди или комплект из брюк с шёлковой блузой. Какой стиль вам ближе?",
]

export function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    await new Promise((resolve) => setTimeout(resolve, 1500))

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: SAMPLE_RESPONSES[Math.floor(Math.random() * SAMPLE_RESPONSES.length)],
    }

    setMessages((prev) => [...prev, assistantMessage])
    setIsLoading(false)
  }

  return (
    <div className={styles.container}>
      <ChatHeader />
      
      <div ref={scrollRef} className={styles.messages}>
        <div className={styles.messagesInner}>
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              role={message.role}
              content={message.content}
            />
          ))}
          {isLoading && <MessageBubble role="assistant" content="" isLoading />}
        </div>
      </div>

      {messages.length <= 1 && (
        <div className={styles.suggestionsWrapper}>
          <SuggestionChips onSelect={handleSend} />
        </div>
      )}

      <div className={styles.inputArea}>
        <div className={styles.inputInner}>
          <ChatInput onSend={handleSend} isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}