'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AxiosError } from 'axios';

import { type Message, MessageBubble } from '@/entities/message';
import {
  type ClientChat,
  createChat,
  deleteChat,
  getChatMessages,
  getChats,
  sendChatMessage,
  updateChatTitle,
} from '@/features/chat/api/chatApi';
import { ChatInput, type ChatSendOptions, SuggestionChips } from '@/features/send-message';
import { useAppSelector } from '@/shared/hooks';
import { makeUniqueTitle } from '@/shared/lib/makeUniqueTitle';
import { TrashIcon } from '@/shared/ui';
import { ChatHeader } from '@/widgets';
import { LookCard } from '@/widgets/LookCard';

import styles from './ChatWidget.module.css';

const INITIAL_MESSAGES: Message[] = [{ id: '1', role: 'assistant', content: '' }];

function formatChatName(chat: ClientChat, index: number) {
  if (chat.title?.trim()) {
    return chat.title.trim();
  }

  return `Chat ${index + 1}`;
}

function buildChatNameFromMessage(text: string) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return 'AI Wardrobe';
  }

  const sliced = normalized.slice(0, 48).trim();
  return sliced.length < normalized.length ? `${sliced}...` : sliced;
}

function isTemporaryChatTitle(title: string | null | undefined) {
  const value = title?.trim().toLowerCase() ?? '';
  return !value || value === 'ai wardrobe' || value.startsWith('new chat') || value.startsWith('новый чат');
}

function formatChatListDate(chat: ClientChat, index: number) {
  const locale = typeof navigator !== 'undefined' ? navigator.language : 'en-US';
  const raw = chat.updatedAt ?? chat.createdAt;
  if (!raw) {
    return `#${index + 1}`;
  }
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    return `#${index + 1}`;
  }
  return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' });
}

export function ChatWidget() {
  const { t, i18n } = useTranslation();
  const { user } = useAppSelector((state) => state.user);
  const [messages, setMessages] = useState<Message[]>([
    { ...INITIAL_MESSAGES[0], content: t('chat.welcomeMessage') },
  ]);
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

  const initialMessages: Message[] = [{ ...INITIAL_MESSAGES[0], content: t('chat.welcomeMessage') }];

  useEffect(() => {
    // Keep default greeting in sync with selected language
    // when chat has no loaded history yet.
    setMessages((prev) => {
      if (prev.length !== 1) return prev;
      if (prev[0]?.role !== 'assistant') return prev;
      return [{ ...prev[0], content: t('chat.welcomeMessage') }];
    });
  }, [t, i18n.language]);

  const loadChatMessages = async (nextChatId: string) => {
    const history = await getChatMessages(nextChatId, 50);

    setChatId(nextChatId);
    setMessages(
      history.length > 0
        ? (() => {
            const usedTitles = new Set<string>();
            return history.map((message) => {
              if (!message.look) {
                return {
                  id: message.id,
                  role: message.role,
                  content: message.content,
                  createdAt: message.createdAt ? new Date(message.createdAt) : undefined,
                  cloths: message.cloths,
                } satisfies Message;
              }

              const base = message.look.look.title;
              const unique = makeUniqueTitle(base, usedTitles);
              usedTitles.add(unique);

              const generated = {
                ...message.look,
                look: { ...message.look.look, title: unique },
              };

              return {
                id: message.id,
                role: message.role,
                content: <LookCard generated={generated} />,
                createdAt: message.createdAt ? new Date(message.createdAt) : undefined,
                cloths: undefined,
                lookTitle: unique,
              } satisfies Message;
            });
          })()
        : initialMessages,
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
      const chatTitle = `${t('chat.newChat')} ${now.toLocaleDateString(i18n.language, {
        day: '2-digit',
        month: '2-digit',
      })}`;
      const newChatId = await createChat(chatTitle);

      const newChat: ClientChat = {
        id: newChatId,
        title: chatTitle,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      setChats((prev) => [newChat, ...prev]);
      setChatId(newChatId);
      setMessages(initialMessages);
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
        setMessages(initialMessages);
      }
    } catch (error) {
      console.error('Failed to delete chat', error);
    } finally {
      setIsBootstrapping(false);
    }
  };

  const handleSend = async (content: string) => {
    return handleSendWithOptions(content, { createLook: false });
  };

  const handleSendWithOptions = async (content: string, options?: ChatSendOptions) => {
    const trimmed = content.trim();
    if (!trimmed || isLoading || isBootstrapping) return;

    if (!user) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: t('chat.signInRequired'),
        },
      ]);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      cloths: options?.clothPreview,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      let currentChatId = chatId;
      if (!currentChatId) {
        const initialChatTitle = buildChatNameFromMessage(trimmed);
        const createdChatId = await createChat(initialChatTitle);
        currentChatId = createdChatId;
        setChatId(createdChatId);
        const t = new Date().toISOString();
        setChats((prev) => [
          {
            id: createdChatId,
            title: initialChatTitle,
            createdAt: t,
            updatedAt: t,
          },
          ...prev,
        ]);
      }

      const existingChat = chats.find((chat) => chat.id === currentChatId);
      if (existingChat && isTemporaryChatTitle(existingChat.title)) {
        const nextChatTitle = buildChatNameFromMessage(trimmed);
        const updatedChat = await updateChatTitle(currentChatId, nextChatTitle);
        setChats((prev) => [
          updatedChat,
          ...prev.filter((chat) => chat.id !== currentChatId),
        ]);
      }

      const assistantMessage = await sendChatMessage(currentChatId, trimmed, {
        createLook: Boolean(options?.createLook),
        useWardrobe: Boolean(options?.useWardrobe),
        clothIds: options?.clothIds,
        weather: options?.weather ?? null,
      });

      setMessages((prev) => [
        ...prev,
        (() => {
          if (!assistantMessage.look) {
            return {
              id: assistantMessage.id,
              role: 'assistant',
              content: assistantMessage.content,
              createdAt: assistantMessage.createdAt ? new Date(assistantMessage.createdAt) : undefined,
              cloths: assistantMessage.cloths,
            } satisfies Message;
          }

          const used = prev.map((m) => m.lookTitle).filter(Boolean) as string[];
          const unique = makeUniqueTitle(assistantMessage.look.look.title, used);
          const generated = {
            ...assistantMessage.look,
            look: { ...assistantMessage.look.look, title: unique },
          };

          return {
            id: assistantMessage.id,
            role: 'assistant',
            content: <LookCard generated={generated} />,
            createdAt: assistantMessage.createdAt ? new Date(assistantMessage.createdAt) : undefined,
            cloths: undefined,
            lookTitle: unique,
          } satisfies Message;
        })(),
      ]);

      setChats((prev) => {
        const currentChat = prev.find((chat) => chat.id === currentChatId);
        const t = new Date().toISOString();
        const updatedChat: ClientChat = {
          id: currentChatId,
          title: currentChat?.title ?? buildChatNameFromMessage(trimmed),
          createdAt: currentChat?.createdAt ?? t,
          updatedAt: t,
        };

        return [updatedChat, ...prev.filter((chat) => chat.id !== currentChatId)];
      });
    } catch (e) {
      let errText = e instanceof Error ? e.message : t('chat.sendFailed');
      if (e instanceof AxiosError && [401, 403].includes(e.response?.status ?? 0)) {
        errText = t('chat.signInRequiredDetailed');
      }
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `${t('chat.errorPrefix')}: ${errText}`,
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
          aria-label={t('chat.history')}
        >
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>{t('chat.history')}</h2>
            <button
              type="button"
              className={styles.newChatButton}
              onClick={() => void handleCreateNewChat()}
              disabled={!user || isBootstrapping || isLoading}
            >
              {t('chat.newChat')}
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
                    <span className={styles.chatListMeta}>{formatChatListDate(chat, index)}</span>
                  </button>
                  {chatPendingDeleteId === chat.id ? (
                    <div className={styles.deleteConfirm}>
                      <button
                        type="button"
                        className={styles.confirmDeleteButton}
                        onClick={() => void handleDeleteChat(chat.id)}
                      >
                        {t('chat.deleteQuestion')}
                      </button>
                      <button
                        type="button"
                        className={styles.cancelDeleteButton}
                        onClick={() => setChatPendingDeleteId(null)}
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={styles.deleteChatButton}
                      aria-label={t('chat.deleteChat')}
                      onClick={() => handleRequestDeleteChat(chat.id)}
                    >
                      <TrashIcon className={styles.deleteChatIcon} />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className={styles.emptyState}>{t('chat.historyEmpty')}</p>
            )}
          </div>
        </aside>

        <div className={styles.chatPanel}>
          <div ref={scrollRef} className={styles.messages}>
            <div className={styles.messagesInner}>
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  cloths={message.cloths}
                />
              ))}
              {isLoading && <MessageBubble role="assistant" content="" isLoading />}
            </div>
          </div>

          {!isBootstrapping && (
            <div className={styles.suggestionsWrapper}>
              <SuggestionChips onSelect={handleSend} />
            </div>
          )}

          <div className={styles.inputArea}>
            <div className={styles.inputInner}>
              <ChatInput
                onSend={handleSendWithOptions}
                isLoading={isLoading || isBootstrapping}
                wardrobeEnabled={Boolean(user)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
