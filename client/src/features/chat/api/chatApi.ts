import { CHAT_API_ROUTES } from '@/shared/constants/chatApiRoutes';
import { axiosInstance } from '@/shared/lib/axiosInstance';
import type { ServerResponseType } from '@/shared/types';
import type { GeneratedLook } from '@/entities/look';

export type ClientChatMessageCloth = {
  id: string;
  title: string;
  category?: string | null;
  color?: string | null;
  image?: string | null;
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

export type ClientWeather = {
  temperature?: string | null;
  feels_like?: string | null;
  description?: string | null;
  humidity?: string | null;
  wind_speed?: string | null;
  location?: string | null;
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
  assistantMessage?: ClientChatMessage;
  assistantMessages?: ClientChatMessage[];
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
  options?: {
    createLook?: boolean;
    useWardrobe?: boolean;
    clothIds?: number[];
    weather?: ClientWeather | null;
  },
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
      weather: options?.weather ?? undefined,
    },
  );

  const payload = data.data;
  if (payload.assistantMessage) return payload.assistantMessage;
  if (Array.isArray(payload.assistantMessages) && payload.assistantMessages.length) {
    // Совместимость: если сервер отдаёт несколько сообщений — вернём первое,
    // а компонент чата может отдельно использовать assistantMessages через расширение ниже.
    return payload.assistantMessages[0];
  }
  throw new Error('Invalid chat response: missing assistantMessage');
}

export async function sendChatMessages(
  chatId: string,
  text: string,
  options?: {
    createLook?: boolean;
    useWardrobe?: boolean;
    clothIds?: number[];
    weather?: ClientWeather | null;
  },
): Promise<ClientChatMessage[]> {
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
      weather: options?.weather ?? undefined,
    },
  );

  const payload = data.data;
  if (Array.isArray(payload.assistantMessages) && payload.assistantMessages.length) {
    return payload.assistantMessages;
  }
  if (payload.assistantMessage) return [payload.assistantMessage];
  throw new Error('Invalid chat response: missing assistant message(s)');
}

export async function getChatMessages(chatId: string, limit = 20): Promise<ClientChatMessage[]> {
  const { data } = await axiosInstance.get<ServerResponseType<ClientChatMessage[]>>(
    CHAT_API_ROUTES.CHAT_MESSAGES(chatId),
    { params: { limit } },
  );

  return data.data;
}

export async function setSuggestedLookId(
  chatId: string,
  messageId: string,
  suggestedLookId: string,
): Promise<ClientChatMessage> {
  const { data } = await axiosInstance.patch<ServerResponseType<ClientChatMessage>>(
    CHAT_API_ROUTES.CHAT_MESSAGE(chatId, messageId),
    { suggestedLookId },
  );
  return data.data;
}
