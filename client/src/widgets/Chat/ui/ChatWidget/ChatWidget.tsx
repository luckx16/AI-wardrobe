'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { type Message, MessageBubble } from '@/entities/message';
import {
  type ClientChat,
  createChat,
  deleteChat,
  getChatMessages,
  getChats,
  setSuggestedLookId,
  updateChatTitle,
} from '@/features/chat/api/chatApi';
import { ChatInput, type ChatSendOptions } from '@/features/send-message';
import { useAppSelector } from '@/shared/hooks';
import { getAccessToken } from '@/shared/lib/axiosInstance';
import { makeUniqueTitle } from '@/shared/lib/makeUniqueTitle';
import { TrashIcon, useToast } from '@/shared/ui';
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
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const { user } = useAppSelector((state) => state.user);
  const [messages, setMessages] = useState<Message[]>([
    { ...INITIAL_MESSAGES[0], content: t('chat.welcomeMessage') },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [chatId, setChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<ClientChat[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatPendingDeleteId, setChatPendingDeleteId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const wsConnectingRef = useRef<Promise<WebSocket> | null>(null);

  const buildWsUrl = (token: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const derivedBase = apiUrl
      ? apiUrl.replace(/\/api\/?$/, '').replace(/^http/i, 'ws')
      : (typeof window !== 'undefined'
          ? window.location.origin.replace(/^http/i, 'ws')
          : 'ws://localhost:4000');
    const base = process.env.NEXT_PUBLIC_WS_URL || derivedBase;
    return `${base.replace(/\/$/, '')}/ws/chat?token=${encodeURIComponent(token)}`;
  };

  const attachWsHandlers = (ws: WebSocket) => {
    ws.onmessage = (evt) => {
      let payload: any;
      try {
        payload = JSON.parse(String(evt.data));
      } catch {
        return;
      }

      if (payload?.type === 'chat.upsert' && payload?.data?.id) {
        const c = payload.data as ClientChat;
        setChats((prev) => {
          const rest = prev.filter((x) => x.id !== c.id);
          return [c, ...rest];
        });
        setChatId((prev) => prev ?? String(c.id));
        return;
      }

      if (payload?.type === 'chat.messageCreated' && payload?.data?.message) {
        const m = payload.data.message;
        const currentChatId = payload.data.chatId;
        if (currentChatId) setChatId(String(currentChatId));

        setMessages((prev) => {
          const next = [...prev];
          if (!m.look) {
            next.push({
              id: m.id,
              role: m.role,
              content: m.content,
              createdAt: m.createdAt ? new Date(m.createdAt) : undefined,
              cloths: m.cloths,
            } satisfies Message);
            return next;
          }

          const usedTitles = next.map((x) => x.lookTitle).filter(Boolean) as string[];
          const usedSet = new Set(usedTitles);
          const baseTitle = m.look.look.title;
          const unique = makeUniqueTitle(baseTitle, usedSet);

          const generated = {
            ...m.look,
            look: { ...m.look.look, title: unique },
          };

          next.push({
            id: m.id,
            role: m.role,
            content: (
              <LookCard
                generated={generated}
                onSaved={(savedLookId) => {
                  void setSuggestedLookId(String(currentChatId), m.id, savedLookId);
                }}
              />
            ),
            createdAt: m.createdAt ? new Date(m.createdAt) : undefined,
            cloths: undefined,
            lookTitle: unique,
          } satisfies Message);
          return next;
        });

        // Пузырёк загрузки ассистента показываем только после того,
        // как сервер подтвердил user-сообщение (чтобы не мигал).
        if (m.role === 'user') {
          setIsAssistantTyping(true);
        }
        if (m.role === 'assistant') {
          setIsAssistantTyping(false);
          setIsLoading(false);
        }
        return;
      }

      if (payload?.type === 'chat.error') {
        const msg = payload?.data?.message ?? 'Не удалось отправить сообщение';
        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: 'assistant', content: `Ошибка: ${String(msg)}` },
        ]);
        setIsAssistantTyping(false);
        setIsLoading(false);
      }
    };

    ws.onerror = () => {
      // ignore (UI покажет ошибку при отправке)
    };

    ws.onclose = () => {
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
    };
  };

  const ensureWsOpen = async () => {
    const existing = wsRef.current;
    if (existing && existing.readyState === WebSocket.OPEN) {
      return existing;
    }

    const token = getAccessToken();
    if (!token) {
      throw new Error('Нужно войти в аккаунт, чтобы пользоваться AI-чатом.');
    }

    if (wsConnectingRef.current) {
      return wsConnectingRef.current;
    }

    const p = new Promise<WebSocket>((resolve, reject) => {
      const url = buildWsUrl(token);
      const ws = new WebSocket(url);
      wsRef.current = ws;
      attachWsHandlers(ws);

      const timeout = window.setTimeout(() => {
        try {
          ws.close();
        } catch {
          // ignore
        }
        reject(new Error('Не удалось подключиться к чату. Попробуйте ещё раз.'));
      }, 2500);

      ws.onopen = () => {
        window.clearTimeout(timeout);
        resolve(ws);
      };
      ws.onclose = () => {
        window.clearTimeout(timeout);
      };
    }).finally(() => {
      wsConnectingRef.current = null;
    });

    wsConnectingRef.current = p;
    return p;
  };

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
                content: (
                  <LookCard
                    generated={generated}
                    onSaved={(savedLookId) => {
                      if (!nextChatId) return;
                      void setSuggestedLookId(nextChatId, message.id, savedLookId);
                    }}
                  />
                ),
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

  useEffect(() => {
    if (!user) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    const token = getAccessToken();
    if (!token) return;
    const ws = new WebSocket(buildWsUrl(token));
    wsRef.current = ws;
    attachWsHandlers(ws);

    return () => {
      ws.close();
      if (wsRef.current === ws) wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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
      toast({ variant: 'error', title: 'Ошибка', description: 'Не удалось загрузить чат' });
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
      toast({ variant: 'error', title: 'Ошибка', description: 'Не удалось создать чат' });
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
      toast({ variant: 'error', title: 'Ошибка', description: 'Не удалось удалить чат' });
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

    // Сообщение пользователя добавится из WS (chat.messageCreated).
    // Здесь только блокируем ввод; "typing" ассистента включим после подтверждения user-msg от сервера.
    setIsLoading(true);
    setIsAssistantTyping(false);

    try {
      const currentChatId = chatId;
      const ws = await ensureWsOpen();

      setIsLoading(true);
      ws.send(
        JSON.stringify({
          type: 'chat.send',
          data: {
            chatId: currentChatId,
            text: trimmed,
            options: {
              createLook: Boolean(options?.createLook),
              useWardrobe: Boolean(options?.useWardrobe),
              clothIds: options?.clothIds,
              weather: options?.weather ?? null,
            },
          },
        }),
      );
    } catch (e) {
      const errText = e instanceof Error ? e.message : 'Не удалось отправить сообщение';
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `${t('chat.errorPrefix')}: ${errText}`,
        },
      ]);
      setIsAssistantTyping(false);
      setIsLoading(false);
    } finally {
      // isLoading сбрасывается по событию от WS (или по ошибке)
    }
  };

  return (
    <div className={styles.container}>
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
              {isAssistantTyping && <MessageBubble role="assistant" content="" isLoading />}
            </div>
          </div>

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
