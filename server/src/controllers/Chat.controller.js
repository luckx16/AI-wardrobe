const { Chat, ChatMessage } = require('../db/models');
const formatResponse = require('../utils/formatResponse');
const { generateAiReply } = require('../services/AiChat.service');

const HISTORY_LIMIT = 20;

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

function toClientMessage(message) {
  return {
    id: message.id?.toString?.() ?? String(message.id),
    role: message.role,
    content: messageContentToText(message.content),
    imagePrompt: messageImagePrompt(message.content),
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
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

      return res.json(
        formatResponse(200, 'Messages loaded', messages.slice().reverse().map(toClientMessage)),
      );
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

      if (!text) {
        return res.status(400).json(formatResponse(400, 'Text is required', null));
      }

      const chat = await Chat.findOne({
        where: { id: chatId, user_id: user.id },
      });

      if (!chat) {
        return res.status(404).json(formatResponse(404, 'Chat not found', null));
      }

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

      const userMessage = await ChatMessage.create({
        chat_id: chatId,
        role: 'user',
        content: { text },
      });

      const aiResult = await generateAiReply({
        userId: user.id,
        userName: user.name ?? 'User',
        text,
        historyMessages,
      });

      const assistantMessage = await ChatMessage.create({
        chat_id: chatId,
        role: 'assistant',
        content: {
          text: aiResult.replyText ?? '...',
          imagePrompt: aiResult.imagePrompt ?? null,
        },
      });

      await chat.update({ updatedAt: new Date() });

      return res.status(201).json(
        formatResponse(201, 'Message generated', {
          chatId: chat.id.toString(),
          userMessage: toClientMessage(userMessage),
          assistantMessage: toClientMessage(assistantMessage),
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
