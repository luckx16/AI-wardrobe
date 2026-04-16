'use client';

import { useEffect, useRef, useState } from 'react';

import { AxiosError } from 'axios';

import { type Message, MessageBubble } from '@/entities/message';
import {
  type ClientChat,
  createChat,
  deleteChat,
  getChatMessages,
  getChats,
  sendChatMessage,
  updateChatName,
} from '@/features/chat/api/chatApi';
import { ChatInput, SuggestionChips } from '@/features/send-message';
import { useAppSelector } from '@/shared/hooks';
import { TrashIcon } from '@/shared/ui';
import { ChatHeader } from '@/widgets';

import styles from './ChatWidget.module.css';

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content:
      'Привет! Я ваш персональный AI-стилист. Расскажите о вашем стиле, предстоящем мероприятии или покажите фото гардероба — помогу создать идеальный образ!',
  },
];

function formatChatName(chat: ClientChat, index: number) {
  if (chat.name?.trim()) {
    return chat.name.trim();
  }

  const fallbackDate = chat.updatedAt ?? chat.createdAt;
  if (!fallbackDate) {
    return `Чат ${index + 1}`;
  }

  return `Чат ${new Date(fallbackDate).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
  })}`;
}

function buildChatNameFromMessage(text: string) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return 'AI Wardrobe';
  }

  const sliced = normalized.slice(0, 48).trim();
  return sliced.length < normalized.length ? `${sliced}...` : sliced;
}

function isTemporaryChatName(name: string | null | undefined) {
  const value = name?.trim().toLowerCase() ?? '';
  return !value || value === 'ai wardrobe' || value.startsWith('новый чат');
}

export function ChatWidget() {
  const { user } = useAppSelector((state) => state.user);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [chatId, setChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<ClientChat[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatPendingDeleteId, setChatPendingDeleteId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatMessages = async (nextChatId: string) => {
    const history = await getChatMessages(nextChatId, 50);

    setChatId(nextChatId);
    setMessages(
      history.length > 0
        ? history.map((message) => ({
            id: message.id,
            role: message.role,
            content: message.content,
            createdAt: message.createdAt,
          }))
        : INITIAL_MESSAGES,
    );
  };

  useEffect(() => {
    let isMounted = true;

    const bootstrapChat = async () => {
      try {
        const loadedChats = await getChats();
        const latestChat = loadedChats[0];

        if (!isMounted) {
          return;
        }

        setChats(loadedChats);

        if (!latestChat) {
          return;
        }

        if (!isMounted) {
          return;
        }

        await loadChatMessages(latestChat.id);
      } catch (error) {
        console.error('Failed to bootstrap chat', error);
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    };

    void bootstrapChat();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectChat = async (nextChatId: string) => {
    if (nextChatId === chatId || isLoading || isBootstrapping) {
      setIsSidebarOpen(false);
      return;
    }

    try {
      setChatPendingDeleteId(null);
      setIsBootstrapping(true);
      await loadChatMessages(nextChatId);
      setIsSidebarOpen(false);
    } catch (error) {
      console.error('Failed to load selected chat', error);
    } finally {
      setIsBootstrapping(false);
    }
  };

  const handleCreateNewChat = async () => {
    if (!user || isLoading || isBootstrapping) return;

    try {
      setIsBootstrapping(true);

      const now = new Date();
      const chatName = `Новый чат ${now.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
      })}`;
      const newChatId = await createChat(chatName);

      const newChat: ClientChat = {
        id: newChatId,
        name: chatName,
        createdAt: now,
        updatedAt: now,
      };

      setChats((prev) => [newChat, ...prev]);
      setChatId(newChatId);
      setMessages(INITIAL_MESSAGES);
      setIsSidebarOpen(false);
      setChatPendingDeleteId(null);
    } catch (error) {
      console.error('Failed to create chat', error);
    } finally {
      setIsBootstrapping(false);
    }
  };

  const handleRequestDeleteChat = (targetChatId: string) => {
    if (isLoading || isBootstrapping) return;
    setChatPendingDeleteId((prev) => (prev === targetChatId ? null : targetChatId));
  };

  const handleDeleteChat = async (targetChatId: string) => {
    if (isLoading || isBootstrapping) return;

    try {
      setChatPendingDeleteId(null);
      setIsBootstrapping(true);
      await deleteChat(targetChatId);

      const nextChats = chats.filter((chat) => chat.id !== targetChatId);
      setChats(nextChats);

      if (chatId !== targetChatId) {
        return;
      }

      const nextActiveChat = nextChats[0];
      if (nextActiveChat) {
        await loadChatMessages(nextActiveChat.id);
      } else {
        setChatId(null);
        setMessages(INITIAL_MESSAGES);
      }
    } catch (error) {
      console.error('Failed to delete chat', error);
    } finally {
      setIsBootstrapping(false);
    }
  };

  const handleSend = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || isLoading || isBootstrapping) return;

    if (!user) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Чтобы пользоваться AI-чатом, сначала войдите в аккаунт.',
        },
      ]);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      let currentChatId = chatId;
      if (!currentChatId) {
        const initialChatName = buildChatNameFromMessage(trimmed);
        const createdChatId = await createChat(initialChatName);
        currentChatId = createdChatId;
        setChatId(createdChatId);
        setChats((prev) => [
          {
            id: createdChatId,
            name: initialChatName,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          ...prev,
        ]);
      }

      const existingChat = chats.find((chat) => chat.id === currentChatId);
      if (existingChat && isTemporaryChatName(existingChat.name)) {
        const nextChatName = buildChatNameFromMessage(trimmed);
        const updatedChat = await updateChatName(currentChatId, nextChatName);
        setChats((prev) => [
          updatedChat,
          ...prev.filter((chat) => chat.id !== currentChatId),
        ]);
      }

      const assistantMessage = await sendChatMessage(currentChatId, trimmed);

      setChats((prev) => {
        const currentChat = prev.find((chat) => chat.id === currentChatId);
        const updatedChat: ClientChat = {
          id: currentChatId,
          name: currentChat?.name ?? buildChatNameFromMessage(trimmed),
          createdAt: currentChat?.createdAt ?? new Date(),
          updatedAt: new Date(),
        };

        return [updatedChat, ...prev.filter((chat) => chat.id !== currentChatId)];
      });

      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessage.id,
          role: 'assistant',
          content: assistantMessage.content,
        },
      ]);
    } catch (e) {
      let errText = e instanceof Error ? e.message : 'Не удалось отправить сообщение';
      if (e instanceof AxiosError && [401, 403].includes(e.response?.status ?? 0)) {
        errText = 'Нужно войти в аккаунт, чтобы пользоваться AI-чатом.';
      }
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Ошибка: ${errText}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <ChatHeader onToggleHistory={() => setIsSidebarOpen((prev) => !prev)} />

      <div className={styles.layout}>
        <aside
          className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}
          aria-label="История чатов"
        >
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>История</h2>
            <button
              type="button"
              className={styles.newChatButton}
              onClick={() => void handleCreateNewChat()}
              disabled={!user || isBootstrapping || isLoading}
            >
              Новый чат
            </button>
          </div>

          <div className={styles.chatList}>
            {chats.length > 0 ? (
              chats.map((chat, index) => (
                <div
                  key={chat.id}
                  className={`${styles.chatListItem} ${chat.id === chatId ? styles.chatListItemActive : ''}`}
                >
                  <button
                    type="button"
                    className={styles.chatListButton}
                    onClick={() => void handleSelectChat(chat.id)}
                  >
                    <span className={styles.chatListTitle}>{formatChatName(chat, index)}</span>
                    <span className={styles.chatListMeta}>
                      {new Date(chat.updatedAt ?? chat.createdAt ?? Date.now()).toLocaleDateString('ru-RU')}
                    </span>
                  </button>
                  {chatPendingDeleteId === chat.id ? (
                    <div className={styles.deleteConfirm}>
                      <button
                        type="button"
                        className={styles.confirmDeleteButton}
                        onClick={() => void handleDeleteChat(chat.id)}
                      >
                        Удалить?
                      </button>
                      <button
                        type="button"
                        className={styles.cancelDeleteButton}
                        onClick={() => setChatPendingDeleteId(null)}
                      >
                        Отмена
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={styles.deleteChatButton}
                      aria-label="Удалить чат"
                      onClick={() => handleRequestDeleteChat(chat.id)}
                    >
                      <TrashIcon className={styles.deleteChatIcon} />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className={styles.emptyState}>История появится после первого диалога с AI.</p>
            )}
          </div>
        </aside>

        <div className={styles.chatPanel}>
          <div ref={scrollRef} className={styles.messages}>
            <div className={styles.messagesInner}>
              {messages.map((message) => (
                <MessageBubble key={message.id} role={message.role} content={message.content} />
              ))}
              {isLoading && <MessageBubble role="assistant" content="" isLoading />}
            </div>
          </div>

          {messages.length <= 1 && !isBootstrapping && (
            <div className={styles.suggestionsWrapper}>
              <SuggestionChips onSelect={handleSend} />
            </div>
          )}

          <div className={styles.inputArea}>
            <div className={styles.inputInner}>
              <ChatInput onSend={handleSend} isLoading={isLoading || isBootstrapping} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
