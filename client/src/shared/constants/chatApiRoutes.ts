export const CHAT_API_ROUTES = {
  CHATS: '/chats',
  CHAT: (chatId: string) => `/chats/${chatId}`,
  CHAT_MESSAGES: (chatId: string) => `/chats/${chatId}/messages`,
  CHAT_MESSAGE: (chatId: string, messageId: string) => `/chats/${chatId}/messages/${messageId}`,
} as const;
