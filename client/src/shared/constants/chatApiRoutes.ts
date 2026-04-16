export const CHAT_API_ROUTES = {
  CHATS: '/chats',
  CHAT: (chatId: string) => `/chats/${chatId}`,
  CHAT_MESSAGES: (chatId: string) => `/chats/${chatId}/messages`,
} as const;
