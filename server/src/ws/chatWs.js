const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');
const { URL } = require('node:url');
const { generateAiReply } = require('../services/AiChat.service');
const { Chat, ChatMessage, Cloth, MessageCloth } = require('../db/models');
const { compactItem } = require('../utils/stylistPrompt');
const lookService = require('../services/Look.service');
const { generateLook, generateLookVariant } = require('../services/LookGenerate.service');

const HISTORY_LIMIT = 20;
const WARDROBE_CHAT_LIMIT = 40;

function safeSend(ws, payload) {
  try {
    ws.send(JSON.stringify(payload));
  } catch {
    // ignore
  }
}

function parseToken(req) {
  const u = new URL(req.url, 'http://localhost');
  return u.searchParams.get('token');
}

function verifyAccessToken(token) {
  const { user } = jwt.verify(token, process.env.JWT_ACCESS);
  return user;
}

function nonEmpty(v) {
  if (v == null) return null;
  const s = String(v).trim();
  return s ? s : null;
}

function normalizeWeatherInput(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const w = {
    location: nonEmpty(raw.location),
    temperature: nonEmpty(raw.temperature),
    feels_like: nonEmpty(raw.feels_like ?? raw.feelsLike),
    description: nonEmpty(raw.description),
    wind_speed: nonEmpty(raw.wind_speed ?? raw.windSpeed),
    humidity: nonEmpty(raw.humidity),
  };
  return Object.values(w).some(Boolean) ? w : null;
}

function parseClothIdsFromBody(body) {
  const raw = body?.clothIds ?? body?.cloth_ids;
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return [...new Set(raw.map(Number).filter(Number.isFinite))];
  }
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return [raw];
  }
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return [...new Set(parsed.map(Number).filter(Number.isFinite))];
      }
    } catch {
      // fall through
    }
    return [...new Set(raw.split(/[,\s]+/).map(Number).filter(Number.isFinite))];
  }
  return [];
}

async function validateUserClothIds(userId, ids) {
  if (!ids.length) return [];
  const rows = await Cloth.findAll({
    where: {
      user_id: userId,
      id: ids,
      processing_status: 'completed',
    },
    attributes: ['id'],
  });
  const found = new Set(rows.map((r) => Number(r.id)));
  return ids.filter((id) => found.has(id));
}

function clothRowsToSnippet(rows) {
  return (rows ?? [])
    .map((c) => {
      const plain = c && typeof c.toJSON === 'function' ? c.toJSON() : c;
      return compactItem(plain);
    })
    .join('\n');
}

async function loadWardrobeForChat(userId) {
  return Cloth.findAll({
    where: { user_id: userId, processing_status: 'completed' },
    limit: WARDROBE_CHAT_LIMIT,
    order: [['updatedAt', 'DESC']],
    attributes: [
      'id',
      'title',
      'brand',
      'material',
      'color',
      'category',
      'season',
      'image',
      'ai_metadata',
    ],
  });
}

async function loadClothsForMessages(messageIds, userId) {
  if (!messageIds.length) return new Map();
  const links = await MessageCloth.findAll({
    where: { message_id: messageIds },
    include: [
      {
        model: Cloth,
        as: 'cloth',
        required: true,
        where: { user_id: userId },
        attributes: ['id', 'title', 'category', 'color', 'image'],
      },
    ],
  });

  const map = new Map();
  for (const mid of messageIds) {
    map.set(String(mid), []);
  }
  for (const link of links) {
    const c = link.cloth;
    if (!c) continue;
    const key = String(link.message_id);
    const arr = map.get(key) ?? [];
    arr.push({
      id: String(c.id),
      title: c.title,
      category: c.category,
      color: c.color,
      image: c.image ?? null,
    });
    map.set(key, arr);
  }
  return map;
}

function messageContentToText(content) {
  if (content == null) return '';
  if (typeof content === 'string') return content;
  if (typeof content === 'object' && typeof content.text === 'string') return content.text;
  return '';
}

function messageImagePrompt(content) {
  if (content && typeof content === 'object' && 'imagePrompt' in content) {
    const v = content.imagePrompt;
    return typeof v === 'string' ? v : null;
  }
  return null;
}

function messageLookPayload(content) {
  if (content && typeof content === 'object' && 'look' in content) {
    const v = content.look;
    return v && typeof v === 'object' ? v : null;
  }
  return null;
}

function toClientMessageBase(message, clothsByMessageId) {
  return {
    id: message.id?.toString?.() ?? String(message.id),
    role: message.role,
    content: messageContentToText(message.content),
    imagePrompt: messageImagePrompt(message.content),
    suggestedLookId: message.suggested_look_id != null ? String(message.suggested_look_id) : null,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    cloths: clothsByMessageId?.get(String(message.id)) ?? [],
  };
}

async function toClientMessage(message, userId, lookPayloadsById, clothsByMessageId) {
  const base = toClientMessageBase(message, clothsByMessageId);
  const legacyLook = messageLookPayload(message.content);
  if (legacyLook) {
    base.look = legacyLook;
    return base;
  }
  if (message.suggested_look_id) {
    const key = String(message.suggested_look_id);
    base.look =
      lookPayloadsById?.get(key) ??
      (await lookService.getLookChatPayload(message.suggested_look_id, userId));
  }
  return base;
}

async function toClientMessages(messages, userId) {
  const messageIds = messages.map((m) => m.id);
  const lookIds = messages.map((m) => m.suggested_look_id).filter(Boolean);
  const [clothsByMessageId, lookPayloadsById] = await Promise.all([
    loadClothsForMessages(messageIds, userId),
    lookService.getLookChatPayloadsByIds(lookIds, userId),
  ]);
  return Promise.all(messages.map((m) => toClientMessage(m, userId, lookPayloadsById, clothsByMessageId)));
}

function buildChatTitleFromMessage(text) {
  const normalized = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (!normalized) return 'AI Wardrobe';
  const sliced = normalized.slice(0, 48).trim();
  return sliced.length < normalized.length ? `${sliced}...` : sliced;
}

function isTemporaryChatTitle(title) {
  const v = String(title ?? '').trim().toLowerCase();
  return !v || v === 'ai wardrobe' || v.startsWith('новый чат');
}

function wsError(code, message) {
  return { type: 'chat.error', data: { code, message } };
}

function setupChatWs(httpServer) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/chat' });

  wss.on('connection', (ws, req) => {
    let user;
    try {
      const token = parseToken(req);
      if (!token) throw new Error('No token');
      user = verifyAccessToken(token);
      if (!user?.id) throw new Error('Invalid user');
    } catch {
      ws.close(1008, 'Unauthorized');
      return;
    }

    safeSend(ws, { type: 'chat.ready', data: { ok: true } });

    ws.on('message', async (data) => {
      let payload;
      try {
        payload = JSON.parse(String(data));
      } catch {
        return;
      }

      if (payload?.type !== 'chat.send') return;
      const body = payload?.data && typeof payload.data === 'object' ? payload.data : {};
      const text = String(body.text ?? '').trim();
      if (!text) {
        safeSend(ws, wsError('BAD_REQUEST', 'Text is required'));
        return;
      }

      const createLook = Boolean(body?.options?.createLook);
      const useWardrobe = Boolean(body?.options?.useWardrobe) || createLook;
      const weather = normalizeWeatherInput(body?.options?.weather);

      // 1) Ensure chat
      let chatId = body.chatId != null ? String(body.chatId) : '';
      let chat = null;
      if (chatId) {
        chat = await Chat.findOne({ where: { id: chatId, user_id: user.id } });
      }
      if (!chat) {
        const title = buildChatTitleFromMessage(text);
        chat = await Chat.create({ user_id: user.id, title });
        chatId = chat.id.toString();
        safeSend(ws, {
          type: 'chat.upsert',
          data: { id: chatId, title: chat.title, createdAt: chat.createdAt, updatedAt: chat.updatedAt },
        });
      } else if (isTemporaryChatTitle(chat.title)) {
        const nextTitle = buildChatTitleFromMessage(text);
        if (nextTitle && nextTitle !== chat.title) {
          await chat.update({ title: nextTitle });
        }
      }

      // 2) Persist user message
      const requestedIds = parseClothIdsFromBody(body?.options ?? {});
      const validatedClothIds = useWardrobe ? await validateUserClothIds(user.id, requestedIds) : [];
      const userContent = { text };
      if (validatedClothIds.length) userContent.attachedClothIds = validatedClothIds;
      const userMessage = await ChatMessage.create({
        chat_id: chatId,
        role: 'user',
        content: userContent,
      });
      if (validatedClothIds.length) {
        await MessageCloth.bulkCreate(
          validatedClothIds.map((cloth_id) => ({ message_id: userMessage.id, cloth_id })),
          { ignoreDuplicates: true },
        );
      }

      // Emit user message
      {
        const [userClient] = await toClientMessages([userMessage], user.id);
        safeSend(ws, { type: 'chat.messageCreated', data: { chatId, message: userClient } });
      }

      // 3) Build history
      const prevMessagesDesc = await ChatMessage.findAll({
        where: { chat_id: chatId },
        order: [['createdAt', 'DESC']],
        limit: HISTORY_LIMIT - 1,
      });
      const historyMessages = prevMessagesDesc
        .slice()
        .reverse()
        .map((m) => ({
          role: m.role,
          content: messageContentToText(m.content),
        }));

      // 4) Produce assistant message (createLook/useWardrobe/default)
      let assistantMessages = null;
      let assistantMessage = null;
      let generatedLookResult;

      if (createLook) {
        const wantVariants = (() => {
          const t = text.toLowerCase();
          const m = t.match(/(?:^|\s)(\d{1,2})\s*(?:вариант|варианта|вариантов)\b/);
          if (m) return Number(m[1]);
          if (/\b(несколько|пара|два|три)\b/.test(t) && /\b(вариант|образ|лук)\b/.test(t)) {
            return t.includes('три') ? 3 : 2;
          }
          return 1;
        })();
        const requestedVariants = Math.max(Number(wantVariants) || 1, 1);
        const tooManyRequested = requestedVariants > 3;
        const variantsCount = Math.min(requestedVariants, 3);

        if (variantsCount === 1) {
          generatedLookResult = await generateLook({
            user_id: user.id,
            userPrompt: text,
            attachedClothIds: validatedClothIds,
            weather,
          });
          assistantMessage = await ChatMessage.create({
            chat_id: chatId,
            role: 'assistant',
            content: {
              text: generatedLookResult.response?.look?.metadata?.comment ?? 'Образ собран',
              look: {
                ...generatedLookResult.response,
                comment: generatedLookResult.response?.look?.metadata?.comment ?? undefined,
              },
            },
          });
          const lookClothIds = (generatedLookResult?.response?.cloths ?? [])
            .map((c) => Number(c.id))
            .filter(Number.isFinite);
          if (lookClothIds.length) {
            await MessageCloth.bulkCreate(
              lookClothIds.map((cloth_id) => ({ message_id: assistantMessage.id, cloth_id })),
              { ignoreDuplicates: true },
            );
          }
        } else {
          const results = [];
          for (let i = 0; i < variantsCount; i += 1) {
            // eslint-disable-next-line no-await-in-loop
            const r = await generateLookVariant({
              user_id: user.id,
              userPrompt: text,
              attachedClothIds: validatedClothIds,
              weather,
              variantIndex: i,
              variantsTotal: variantsCount,
            });
            results.push(r.response);
          }

          assistantMessages = [];
          if (tooManyRequested) {
            const info = await ChatMessage.create({
              chat_id: chatId,
              role: 'assistant',
              content: {
                text: 'Я могу предложить максимум 3 варианта образа за раз. Сгенерировала 3 наиболее разные версии.',
              },
            });
            assistantMessages.push(info);
          }
          for (const r of results) {
            // eslint-disable-next-line no-await-in-loop
            const msg = await ChatMessage.create({
              chat_id: chatId,
              role: 'assistant',
              content: {
                text: r?.look?.metadata?.comment ?? 'Образ собран',
                look: {
                  ...r,
                  comment: r?.look?.metadata?.comment ?? undefined,
                },
              },
            });
            assistantMessages.push(msg);
            const lookClothIds = (r?.cloths ?? []).map((c) => Number(c.id)).filter(Number.isFinite);
            if (lookClothIds.length) {
              // eslint-disable-next-line no-await-in-loop
              await MessageCloth.bulkCreate(
                lookClothIds.map((cloth_id) => ({ message_id: msg.id, cloth_id })),
                { ignoreDuplicates: true },
              );
            }
          }
          assistantMessage = assistantMessages[assistantMessages.length - 1];
        }
      } else if (useWardrobe) {
        const clothRows = await loadWardrobeForChat(user.id);
        if (!clothRows.length) {
          safeSend(ws, wsError('WARDROBE_EMPTY', 'Wardrobe has no completed items'));
          return;
        }
        const allowedClothIds = clothRows.map((c) => Number(c.id));
        const wardrobeSnippet = clothRowsToSnippet(clothRows);
        let attachedSnippet = '';
        if (validatedClothIds.length) {
          const attachedRows = await Cloth.findAll({
            where: {
              user_id: user.id,
              id: validatedClothIds,
              processing_status: 'completed',
            },
            attributes: [
              'id',
              'title',
              'brand',
              'material',
              'color',
              'category',
              'season',
              'image',
              'ai_metadata',
            ],
          });
          attachedSnippet = clothRowsToSnippet(attachedRows);
        }

        const aiResult = await generateAiReply({
          userId: user.id,
          userName: user.name ?? 'User',
          text,
          historyMessages,
          weather,
          wardrobeOptions: {
            wardrobeSnippet,
            allowedClothIds,
            attachedSnippet,
          },
        });

        assistantMessage = await ChatMessage.create({
          chat_id: chatId,
          role: 'assistant',
          content: {
            text: aiResult.replyText ?? '...',
            imagePrompt: aiResult.imagePrompt ?? null,
          },
        });

        const refIds = Array.isArray(aiResult.referencedClothIds) ? aiResult.referencedClothIds : [];
        if (refIds.length) {
          await MessageCloth.bulkCreate(
            refIds.map((cloth_id) => ({ message_id: assistantMessage.id, cloth_id })),
            { ignoreDuplicates: true },
          );
        }
      } else {
        const aiResult = await generateAiReply({
          userId: user.id,
          userName: user.name ?? 'User',
          text,
          historyMessages,
          weather,
        });

        assistantMessage = await ChatMessage.create({
          chat_id: chatId,
          role: 'assistant',
          content: {
            text: aiResult.replyText ?? '...',
            imagePrompt: aiResult.imagePrompt ?? null,
          },
        });
      }

      await chat.update({ updatedAt: new Date() });
      safeSend(ws, {
        type: 'chat.upsert',
        data: { id: chatId, title: chat.title, createdAt: chat.createdAt, updatedAt: chat.updatedAt },
      });

      // Emit assistant message(s)
      const lookPayloadMap = new Map();
      if (createLook && generatedLookResult?.response?.look?.id) {
        lookPayloadMap.set(String(generatedLookResult.response.look.id), generatedLookResult.response);
      }

      const assistantRows = assistantMessages && assistantMessages.length ? assistantMessages : [assistantMessage];
      const clientMsgs = await toClientMessages(assistantRows, user.id);
      for (const cm of clientMsgs) {
        safeSend(ws, { type: 'chat.messageCreated', data: { chatId, message: cm } });
      }
    });

    ws.on('close', () => {
      // no-op (single-user ws)
    });
  });

  return wss;
}

module.exports = {
  setupChatWs,
};
