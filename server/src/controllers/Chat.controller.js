const { Chat, ChatMessage, Cloth, MessageCloth } = require('../db/models');
const formatResponse = require('../utils/formatResponse');
const { compactItem } = require('../utils/stylistPrompt');
const { generateAiReply } = require('../services/AiChat.service');
const { generateLook } = require('../services/LookGenerate.service');
const lookService = require('../services/Look.service');

const HISTORY_LIMIT = 20;
const WARDROBE_CHAT_LIMIT = 40;

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
        attributes: ['id', 'title', 'category', 'color'],
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

/**
 * Старые сообщения могли хранить полный JSON лука в content.look — отдаём как есть.
 * Новые: только suggested_look_id → подгружаем лук из БД (без дублирования в БД).
 */
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

function resolveChatTitle(body) {
  if (typeof body?.title === 'string') return body.title;
  if (typeof body?.name === 'string') return body.name;
  return 'AI Wardrobe';
}

class ChatController {
  static async createChat(req, res) {
    try {
      const { user } = res.locals;
      const title = resolveChatTitle(req.body);

      const chat = await Chat.create({
        user_id: user.id,
        title,
      });

      return res.status(201).json(
        formatResponse(201, 'Chat created', {
          id: chat.id.toString(),
          title: chat.title,
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt,
        }),
      );
    } catch (error) {
      return res
        .status(500)
        .json(formatResponse(500, 'Failed to create chat', null, error?.message ?? error));
    }
  }

  static async getChats(req, res) {
    try {
      const { user } = res.locals;

      const chats = await Chat.findAll({
        where: { user_id: user.id },
        order: [['updatedAt', 'DESC']],
        limit: 20,
      });

      return res.json(
        formatResponse(
          200,
          'Chats loaded',
          chats.map((chat) => ({
            id: chat.id.toString(),
            title: chat.title,
            contextSummary: chat.context_summary,
            createdAt: chat.createdAt,
            updatedAt: chat.updatedAt,
          })),
        ),
      );
    } catch (error) {
      return res
        .status(500)
        .json(formatResponse(500, 'Failed to load chats', null, error?.message ?? error));
    }
  }

  static async updateChat(req, res) {
    try {
      const { user } = res.locals;
      const { chatId } = req.params;
      const title = String(req.body?.title ?? req.body?.name ?? '').trim();

      if (!title) {
        return res.status(400).json(formatResponse(400, 'Chat title is required', null));
      }

      const chat = await Chat.findOne({
        where: { id: chatId, user_id: user.id },
      });

      if (!chat) {
        return res.status(404).json(formatResponse(404, 'Chat not found', null));
      }

      await chat.update({
        title,
      });

      return res.json(
        formatResponse(200, 'Chat updated', {
          id: chat.id.toString(),
          title: chat.title,
          contextSummary: chat.context_summary,
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt,
        }),
      );
    } catch (error) {
      return res
        .status(500)
        .json(formatResponse(500, 'Failed to update chat', null, error?.message ?? error));
    }
  }

  static async deleteChat(req, res) {
    try {
      const { user } = res.locals;
      const { chatId } = req.params;

      const chat = await Chat.findOne({
        where: { id: chatId, user_id: user.id },
      });

      if (!chat) {
        return res.status(404).json(formatResponse(404, 'Chat not found', null));
      }

      await chat.destroy();

      return res.json(
        formatResponse(200, 'Chat deleted', {
          id: String(chatId),
        }),
      );
    } catch (error) {
      return res
        .status(500)
        .json(formatResponse(500, 'Failed to delete chat', null, error?.message ?? error));
    }
  }

  static async getChatMessages(req, res) {
    try {
      const { user } = res.locals;
      const { chatId } = req.params;
      const limit = Math.min(Number(req.query.limit ?? 20), 50);

      const chat = await Chat.findOne({
        where: { id: chatId, user_id: user.id },
      });

      if (!chat) {
        return res.status(404).json(formatResponse(404, 'Chat not found', null));
      }

      const messages = await ChatMessage.findAll({
        where: { chat_id: chatId },
        order: [['createdAt', 'DESC']],
        limit,
      });

      const ordered = messages.slice().reverse();
      const clientMessages = await toClientMessages(ordered, user.id);

      return res.json(formatResponse(200, 'Messages loaded', clientMessages));
    } catch (error) {
      return res
        .status(500)
        .json(formatResponse(500, 'Failed to load messages', null, error?.message ?? error));
    }
  }

  static async postChatMessage(req, res) {
    try {
      const { user } = res.locals;
      const { chatId } = req.params;
      const text = String(req.body?.text ?? '').trim();
      const createLook = Boolean(req.body?.createLook);
      const useWardrobe = Boolean(req.body?.useWardrobe) || createLook;

      if (!text) {
        return res.status(400).json(formatResponse(400, 'Text is required', null));
      }

      const chat = await Chat.findOne({
        where: { id: chatId, user_id: user.id },
      });

      if (!chat) {
        return res.status(404).json(formatResponse(404, 'Chat not found', null));
      }

      const requestedIds = parseClothIdsFromBody(req.body);
      const validatedClothIds = useWardrobe
        ? await validateUserClothIds(user.id, requestedIds)
        : [];

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

      const userContent = { text };
      if (validatedClothIds.length) {
        userContent.attachedClothIds = validatedClothIds;
      }

      const userMessage = await ChatMessage.create({
        chat_id: chatId,
        role: 'user',
        content: userContent,
      });

      if (validatedClothIds.length) {
        await MessageCloth.bulkCreate(
          validatedClothIds.map((cloth_id) => ({
            message_id: userMessage.id,
            cloth_id,
          })),
          { ignoreDuplicates: true },
        );
      }

      let assistantMessage;
      let generatedLookResult;

      if (createLook) {
        generatedLookResult = await generateLook({
          user_id: user.id,
          userPrompt: text,
          attachedClothIds: validatedClothIds,
        });
        assistantMessage = await ChatMessage.create({
          chat_id: chatId,
          role: 'assistant',
          suggested_look_id: generatedLookResult.response?.look?.id ?? null,
          content: {
            text: 'Образ собран',
          },
        });
        const lookClothIds = (generatedLookResult?.response?.cloths ?? [])
          .map((c) => Number(c.id))
          .filter(Number.isFinite);
        if (lookClothIds.length) {
          await MessageCloth.bulkCreate(
            lookClothIds.map((cloth_id) => ({
              message_id: assistantMessage.id,
              cloth_id,
            })),
            { ignoreDuplicates: true },
          );
        }
      } else if (useWardrobe) {
        const clothRows = await loadWardrobeForChat(user.id);
        if (!clothRows.length) {
          return res.status(400).json(
            formatResponse(400, 'Wardrobe has no completed items', null),
          );
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
            refIds.map((cloth_id) => ({
              message_id: assistantMessage.id,
              cloth_id,
            })),
            { ignoreDuplicates: true },
          );
        }
      } else {
        const aiResult = await generateAiReply({
          userId: user.id,
          userName: user.name ?? 'User',
          text,
          historyMessages,
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

      const lookPayloadMap = new Map();
      if (createLook && generatedLookResult?.response?.look?.id) {
        lookPayloadMap.set(String(generatedLookResult.response.look.id), generatedLookResult.response);
      }

      const clothsByMsg = await loadClothsForMessages([userMessage.id, assistantMessage.id], user.id);

      const [userClient, assistantClient] = await Promise.all([
        toClientMessage(userMessage, user.id, lookPayloadMap, clothsByMsg),
        toClientMessage(assistantMessage, user.id, lookPayloadMap, clothsByMsg),
      ]);

      return res.status(201).json(
        formatResponse(201, 'Message generated', {
          chatId: chat.id.toString(),
          userMessage: userClient,
          assistantMessage: assistantClient,
        }),
      );
    } catch (error) {
      return res
        .status(500)
        .json(formatResponse(500, 'Failed to send message', null, error?.message ?? error));
    }
  }
}

module.exports = ChatController;
