import type React from 'react';

export type MessageClothChip = {
  id: string
  title: string
  category?: string | null
  color?: string | null
  image?: string | null
}

export interface Message {
  id: string
  role: "user" | "assistant"
  content: React.ReactNode
  createdAt?: Date
  cloths?: MessageClothChip[]
  lookTitle?: string
}

export interface ChatState {
  messages: Message[]
  isLoading: boolean
}
