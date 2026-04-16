const { getGigaChatClient } = require('./GigaChat.service');

const HISTORY_LIMIT = 20;

// userId -> [{ role, content }]
const histories = new Map();

function pushHistory(userId, message) {
  const prev = histories.get(userId) ?? [];
  const next = [...prev, message].slice(-HISTORY_LIMIT);
  histories.set(userId, next);
  return next;
}

async function generateAiReply({ userId, userName, text }) {
  const client = getGigaChatClient();
  if (!client) {
    return 'AI-режим не настроен: отсутствует GIGACHAT_CREDENTIALS на сервере.';
  }

  const system = {
    role: 'system',
    content:
      'Ты собеседник в общем чате. Отвечай кратко, дружелюбно, по-русски. Если сообщение выглядит как вопрос по коду — отвечай по делу.',
  };

  const userMsg = { role: 'user', content: `${userName}: ${text}` };
  const messages = [system, ...pushHistory(userId, userMsg)];

  const resp = await client.chat({ messages });
  const answer = resp?.choices?.[0]?.message?.content?.trim() || '...';

  pushHistory(userId, { role: 'assistant', content: answer });
  return answer;
}

function clearHistory(userId) {
  histories.delete(userId);
}

module.exports = {
  generateAiReply,
  clearHistory,
};

