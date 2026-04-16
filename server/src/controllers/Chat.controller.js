const { Chat, ChatMessage } = require('../db/models');
const formatResponse = require('../utils/formatResponse');
const { generateAiReply } = require('../services/AiChat.service');

const HISTORY_LIMIT = 20;

function toClientMessage(message) {
  return {
    id: message.id?.toString?.() ?? String(message.id),
    role: message.role,
    content: message.content,
    imagePrompt: message.image_prompt ?? null,
    createdAt: message.createdAt,
  };
}

class ChatController {
  static async createChat(req, res) {
    try {
      const { user } = res.locals;
      const name = typeof req.body?.name === 'string' ? req.body.name : 'AI Wardrobe';

      const chat = await Chat.create({
        user_id: user.id,
        name,
      });

      return res.status(201).json(
        formatResponse(201, 'Chat created', {
          id: chat.id.toString(),
          name: chat.name,
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
            name: chat.name,
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
      const name = String(req.body?.name ?? '').trim();

      if (!name) {
        return res.status(400).json(formatResponse(400, 'Chat name is required', null));
      }

      const chat = await Chat.findOne({
        where: { id: chatId, user_id: user.id },
      });

      if (!chat) {
        return res.status(404).json(formatResponse(404, 'Chat not found', null));
      }

      await chat.update({
        name,
        updatedAt: new Date(),
      });

      return res.json(
        formatResponse(200, 'Chat updated', {
          id: chat.id.toString(),
          name: chat.name,
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

      // Берём историю "до" текущего сообщения, чтобы сервис добавил текст сам.
      const prevMessagesDesc = await ChatMessage.findAll({
        where: { chat_id: chatId },
        order: [['createdAt', 'DESC']],
        limit: HISTORY_LIMIT - 1,
      });

      const historyMessages = prevMessagesDesc
        .slice()
        .reverse()
        .map((m) => ({ role: m.role, content: m.content }));

      const userMessage = await ChatMessage.create({
        chat_id: chatId,
        role: 'user',
        content: text,
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
        content: aiResult.replyText ?? '...',
        image_prompt: aiResult.imagePrompt ?? null,
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
