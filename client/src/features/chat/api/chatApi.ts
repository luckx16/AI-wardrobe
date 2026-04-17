import { CHAT_API_ROUTES } from '@/shared/constants/chatApiRoutes';
import { axiosInstance } from '@/shared/lib/axiosInstance';
import type { ServerResponseType } from '@/shared/types';
import type { GeneratedLook } from '@/entities/look';

export type ClientChatMessageCloth = {
  id: string;
  title: string;
  category?: string | null;
  color?: string | null;
};

export type ClientChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imagePrompt: string | null;
  look?: GeneratedLook | null;
  suggestedLookId?: string | null;
  cloths?: ClientChatMessageCloth[];
  createdAt?: string;
  updatedAt?: string;
};

type CreateChatData = {
  id: string;
  title: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ClientChat = {
  id: string;
  title: string | null;
  contextSummary?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type SendMessageData = {
  chatId: string;
  userMessage: ClientChatMessage;
  assistantMessage: ClientChatMessage;
};

export async function createChat(title = 'AI Wardrobe'): Promise<string> {
  const { data } = await axiosInstance.post<ServerResponseType<CreateChatData>>(CHAT_API_ROUTES.CHATS, {
    title,
  });

  return data.data.id;
}

export async function getChats(): Promise<ClientChat[]> {
  const { data } = await axiosInstance.get<ServerResponseType<ClientChat[]>>(CHAT_API_ROUTES.CHATS);

  return data.data;
}

export async function updateChatTitle(chatId: string, title: string): Promise<ClientChat> {
  const { data } = await axiosInstance.patch<ServerResponseType<ClientChat>>(
    CHAT_API_ROUTES.CHAT(chatId),
    { title },
  );

  return data.data;
}

export async function deleteChat(chatId: string): Promise<string> {
  const { data } = await axiosInstance.delete<ServerResponseType<{ id: string }>>(
    CHAT_API_ROUTES.CHAT(chatId),
  );

  return data.data.id;
}

export async function sendChatMessage(
  chatId: string,
  text: string,
  options?: { createLook?: boolean; useWardrobe?: boolean; clothIds?: number[] },
): Promise<ClientChatMessage> {
  const createLook = Boolean(options?.createLook);
  const useWardrobe =
    Boolean(options?.useWardrobe) || createLook || Boolean(options?.clothIds?.length);
  const { data } = await axiosInstance.post<ServerResponseType<SendMessageData>>(
    CHAT_API_ROUTES.CHAT_MESSAGES(chatId),
    {
      text,
      createLook,
      useWardrobe,
      clothIds: useWardrobe && options?.clothIds?.length ? options.clothIds : undefined,
    },
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
