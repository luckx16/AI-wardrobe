import { CHAT_API_ROUTES } from '@/shared/constants/chatApiRoutes';
import { axiosInstance } from '@/shared/lib/axiosInstance';
import type { ServerResponseType } from '@/shared/types';

export type ClientChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imagePrompt: string | null;
  createdAt?: Date;
};

type CreateChatData = {
  id: string;
  name: string | null;
};

export type ClientChat = {
  id: string;
  name: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

type SendMessageData = {
  chatId: string;
  userMessage: ClientChatMessage;
  assistantMessage: ClientChatMessage;
};

export async function createChat(name = 'AI Wardrobe'): Promise<string> {
  const { data } = await axiosInstance.post<ServerResponseType<CreateChatData>>(CHAT_API_ROUTES.CHATS, {
    name,
  });

  return data.data.id;
}

export async function getChats(): Promise<ClientChat[]> {
  const { data } = await axiosInstance.get<ServerResponseType<ClientChat[]>>(CHAT_API_ROUTES.CHATS);

  return data.data;
}

export async function updateChatName(chatId: string, name: string): Promise<ClientChat> {
  const { data } = await axiosInstance.patch<ServerResponseType<ClientChat>>(
    CHAT_API_ROUTES.CHAT(chatId),
    { name },
  );

  return data.data;
}

export async function deleteChat(chatId: string): Promise<string> {
  const { data } = await axiosInstance.delete<ServerResponseType<{ id: string }>>(
    CHAT_API_ROUTES.CHAT(chatId),
  );

  return data.data.id;
}

export async function sendChatMessage(chatId: string, text: string): Promise<ClientChatMessage> {
  const { data } = await axiosInstance.post<ServerResponseType<SendMessageData>>(
    CHAT_API_ROUTES.CHAT_MESSAGES(chatId),
    { text },
  );

  return data.data.assistantMessage;
}

export async function getChatMessages(chatId: string, limit = 20): Promise<ClientChatMessage[]> {
  const { data } = await axiosInstance.get<ServerResponseType<ClientChatMessage[]>>(
    CHAT_API_ROUTES.CHAT_MESSAGES(chatId),
    { params: { limit } },
  );

  return data.data;
}
