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

function normalizeReferencedIds(raw, allowedSet) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const v of raw) {
    const n = Number(v);
    if (!Number.isFinite(n) || !allowedSet.has(n)) continue;
    if (!out.includes(n)) out.push(n);
  }
  return out;
}

function extractJsonPayload(answer, wardrobeOptions) {
  const allowedSet = wardrobeOptions?.allowedClothIdSet ?? null;
  const fallback = {
    replyText: answer?.trim?.() ?? '...',
    imagePrompt: null,
    referencedClothIds: [],
  };
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
      const base = {
        replyText: parsed.replyText.trim(),
        imagePrompt: typeof parsed.imagePrompt === 'string' ? parsed.imagePrompt.trim() : null,
        referencedClothIds: [],
      };
      if (allowedSet) {
        const ids = normalizeReferencedIds(parsed.referenced_cloth_ids ?? parsed.referencedClothIds, allowedSet);
        base.referencedClothIds = ids;
      }
      return base;
    }
  } catch {
    // ignore
  }

  return fallback;
}

function buildWardrobeSystemExtension(wardrobeOptions) {
  const allowed = wardrobeOptions.allowedClothIds ?? [];
  const lines = [
    'Ты AI Wardrobe, дружелюбный персональный стилист. Всегда отвечай на русском языке.',
    'Ниже передан каталог вещей из гардероба пользователя (каждая строка — одна вещь, у каждой есть числовой id=...).',
    'Пользователь может спрашивать, что из гардероба сочетается с чем-то — отвечай конкретно, ссылаясь на вещи по id из каталога.',
    'Если прикреплены вещи к сообщению — учитывай их в первую очередь.',
    'Не выдумывай id: используй только id из каталога или из списка разрешённых id.',
    '',
    '## Каталог гардероба',
    wardrobeOptions.wardrobeSnippet || '(пусто)',
  ];
  if (wardrobeOptions.attachedSnippet?.trim()) {
    lines.push('', '## Прикреплено к этому сообщению', wardrobeOptions.attachedSnippet.trim());
  }
  lines.push(
    '',
    'Верни результат СТРОГО в формате JSON без markdown и без комментариев:',
    '{"replyText":"...","imagePrompt":null,"referenced_cloth_ids":[числа]}',
    'referenced_cloth_ids — массив id вещей из каталога, которые ты рекомендуешь или упоминаешь как конкретный выбор (может быть пустым []).',
    `Разрешённые id (только из этого набора): ${allowed.join(',')}`,
  );
  return lines.join('\n');
}

async function generateAiReply({ userId, userName, text, historyMessages, wardrobeOptions }) {
  const client = getGigaChatClient();
  if (!client) {
    return {
      replyText: 'AI-режим не настроен: отсутствует GIGACHAT_CREDENTIALS на сервере.',
      imagePrompt: null,
      referencedClothIds: [],
    };
  }

  const useWardrobe = Boolean(wardrobeOptions?.wardrobeSnippet && wardrobeOptions?.allowedClothIds?.length);
  const allowedClothIdSet = useWardrobe
    ? new Set(wardrobeOptions.allowedClothIds.map(Number).filter(Number.isFinite))
    : null;

  const system = useWardrobe
    ? {
        role: 'system',
        content: buildWardrobeSystemExtension({ ...wardrobeOptions, allowedClothIds: wardrobeOptions.allowedClothIds }),
      }
    : {
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
  const payload = extractJsonPayload(answer, useWardrobe ? { allowedClothIdSet } : null);

  if (!Array.isArray(historyMessages)) {
    pushHistory(userId, { role: 'assistant', content: payload.replyText });
  }

  return {
    replyText: payload.replyText,
    imagePrompt: payload.imagePrompt,
    referencedClothIds: payload.referencedClothIds ?? [],
  };
}

function clearHistory(userId) {
  histories.delete(userId);
}

module.exports = {
  generateAiReply,
  clearHistory,
};
