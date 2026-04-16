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

function extractJsonPayload(answer) {
  const fallback = { replyText: answer?.trim?.() ?? '...', imagePrompt: null };
  if (!answer) return fallback;

  const cleaned = String(answer)
    .replace(/```json/gi, '```')
    .replace(/```/g, '')
    .trim();

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end < 0 || end <= start) return fallback;

  const candidate = cleaned.slice(start, end + 1);
  try {
    const parsed = JSON.parse(candidate);
    if (typeof parsed?.replyText === 'string') {
      return {
        replyText: parsed.replyText.trim(),
        imagePrompt: typeof parsed.imagePrompt === 'string' ? parsed.imagePrompt.trim() : null,
      };
    }
  } catch {
    // ignore
  }

  return fallback;
}

async function generateAiReply({ userId, userName, text, historyMessages }) {
  const client = getGigaChatClient();
  if (!client) {
    return {
      replyText: 'AI-режим не настроен: отсутствует GIGACHAT_CREDENTIALS на сервере.',
      imagePrompt: null,
    };
  }

  const system = {
    role: 'system',
    content:
      'Ты AI Wardrobe, дружелюбный персональный стилист. Всегда отвечай на русском языке.\n' +
      'Помогай пользователю собирать образы, сочетать вещи, подбирать стили под событие, погоду, сезон, настроение и особенности фигуры.\n' +
      'Если данных мало, сначала задай 1-2 коротких уточняющих вопроса. Если данных достаточно, предложи конкретный образ.\n' +
      'Ответ должен быть практичным: можно перечислять верх, низ, обувь, верхнюю одежду, аксессуары, цвета и объяснение, почему это сочетается.\n' +
      'Не выдумывай, что ты видишь фото или гардероб пользователя, если он этого не присылал. Сейчас работаем только с текстом, поэтому imagePrompt всегда возвращай null.\n\n' +
      'Верни результат СТРОГО в формате JSON без markdown и без комментариев по следующей схеме:\n' +
      '{"replyText":"...текст ответа...","imagePrompt":null}',
  };

  const userMsg = { role: 'user', content: `${userName}: ${text}` };
  let messages;
  if (Array.isArray(historyMessages)) {
    const safeHistory = historyMessages
      .filter((m) => m && typeof m.role === 'string' && typeof m.content === 'string')
      .slice(-HISTORY_LIMIT)
      .map((m) => ({ role: m.role, content: m.content }));
    messages = [system, ...safeHistory, userMsg];
  } else {
    messages = [system, ...pushHistory(userId, userMsg)];
  }

  if (typeof client.updateToken === 'function') {
    await client.updateToken();
  }

  const resp = await client.chat({ messages });
  const answer = resp?.choices?.[0]?.message?.content?.trim() || '...';
  const payload = extractJsonPayload(answer);

  if (!Array.isArray(historyMessages)) {
    pushHistory(userId, { role: 'assistant', content: payload.replyText });
  }

  return payload;
}

function clearHistory(userId) {
  histories.delete(userId);
}

module.exports = {
  generateAiReply,
  clearHistory,
};
