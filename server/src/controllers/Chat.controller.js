const { Chat, ChatMessage, Cloth, MessageCloth } = require('../db/models');
const db = require('../db/models');
const formatResponse = require('../utils/formatResponse');
const lookService = require('../services/Look.service');

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
    return res
      .status(410)
      .json(formatResponse(410, 'This endpoint is deprecated. Use WebSocket /ws/chat', null));
  }

  static async updateChatMessage(req, res) {
    try {
      const { user } = res.locals;
      const { chatId, messageId } = req.params;
      const raw = req.body?.suggestedLookId ?? req.body?.suggested_look_id ?? null;
      const suggestedLookId = raw != null ? Number(raw) : NaN;

      if (!Number.isFinite(suggestedLookId) || suggestedLookId <= 0) {
        return res.status(400).json(formatResponse(400, 'suggestedLookId must be a positive number', null));
      }

      const chat = await Chat.findOne({
        where: { id: chatId, user_id: user.id },
        attributes: ['id'],
      });
      if (!chat) {
        return res.status(404).json(formatResponse(404, 'Chat not found', null));
      }

      const message = await ChatMessage.findOne({
        where: { id: messageId, chat_id: chatId },
      });
      if (!message) {
        return res.status(404).json(formatResponse(404, 'Message not found', null));
      }

      const look = await db.Look.findOne({
        where: { id: suggestedLookId, user_id: user.id },
        attributes: ['id'],
      });
      if (!look) {
        return res.status(404).json(formatResponse(404, 'Look not found', null));
      }

      await message.update({ suggested_look_id: suggestedLookId });

      const clothsByMsg = await loadClothsForMessages([message.id], user.id);
      const lookPayloadsById = await lookService.getLookChatPayloadsByIds([suggestedLookId], user.id);
      const clientMessage = await toClientMessage(message, user.id, lookPayloadsById, clothsByMsg);

      return res.json(formatResponse(200, 'Message updated', clientMessage));
    } catch (error) {
      return res
        .status(500)
        .json(formatResponse(500, 'Failed to update message', null, error?.message ?? error));
    }
  }
}

module.exports = ChatController;
