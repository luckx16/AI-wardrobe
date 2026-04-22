const { getGigaChatClient } = require('./GigaChat.service');
const { chatAiResponseSchema } = require('../schemas/chatAiResponseSchema');
const { createStyleRulesRetriever } = require('../rag/styleRulesRetriever');
const db = require('../db/models');
const { analyzeWardrobeForChat } = require('./WardrobeAnalyze.service');

const HISTORY_LIMIT = 20;

// userId -> [{ role, content }]
const histories = new Map();

function nonEmpty(v) {
  if (v == null) return null;
  const s = String(v).trim();
  return s ? s : null;
}

function normalizeWeatherForPrompt(weather) {
  if (!weather || typeof weather !== 'object') return null;
  const normalized = {
    location: nonEmpty(weather.location),
    temperature: nonEmpty(weather.temperature),
    feels_like: nonEmpty(weather.feels_like),
    description: nonEmpty(weather.description),
    wind_speed: nonEmpty(weather.wind_speed),
    humidity: nonEmpty(weather.humidity),
  };
  const hasAny = Object.values(normalized).some(Boolean);
  return hasAny ? normalized : null;
}

function mapProfileAndWeatherToMetadataFilters(profile, weather) {
  const p = profile && typeof profile.toJSON === 'function' ? profile.toJSON() : (profile ?? {});
  const filters = {};
  const knownProfileFields = ['skin_tone', 'proportion', 'contrast', 'height'];
  for (const k of knownProfileFields) {
    if (p && typeof p[k] === 'string' && p[k].trim()) filters[k] = p[k].trim();
  }
  if (weather && typeof weather === 'object') {
    if (typeof weather.description === 'string' && weather.description.trim()) {
      filters.weather_description = weather.description.trim();
    }
    if (typeof weather.temperature === 'string' && weather.temperature.trim()) {
      filters.temperature_c = weather.temperature.trim();
    }
  }
  return filters;
}

function buildStyleRulesQuery(profile, userPrompt, weather) {
  const p = profile && typeof profile.toJSON === 'function' ? profile.toJSON() : (profile ?? {});
  const parts = [
    typeof userPrompt === 'string' ? userPrompt.trim() : '',
    typeof p?.wishes === 'string' ? p.wishes.trim() : '',
    typeof weather?.description === 'string' ? weather.description.trim() : '',
    typeof weather?.temperature === 'string' ? `temperature ${weather.temperature}` : '',
  ].filter(Boolean);
  return parts.join('\n');
}

function formatActiveStyleRules(docs) {
  const list = Array.isArray(docs) ? docs : [];
  const lines = [];
  for (let i = 0; i < list.length; i += 1) {
    const doc = list[i];
    const text = typeof doc?.pageContent === 'string' ? doc.pageContent.trim() : '';
    if (!text) continue;
    lines.push(`${i + 1}. ${text}`);
  }
  if (!lines.length) return null;
  return ['## Active Style Rules', ...lines].join('\n');
}

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

    // Нормализуем возможные имена поля referenced ids (snake/camel)
    const normalizedForSchema =
      parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? {
            ...parsed,
            referenced_cloth_ids:
              parsed.referenced_cloth_ids ?? parsed.referencedClothIds ?? parsed.referencedClothIDs,
          }
        : parsed;

    const validated = chatAiResponseSchema.safeParse(normalizedForSchema);
    if (!validated.success) return fallback;

    const data = validated.data;
    const base = {
      replyText: data.replyText,
      imagePrompt: data.imagePrompt ?? null,
      referencedClothIds: [],
    };
    if (allowedSet) {
      base.referencedClothIds = normalizeReferencedIds(data.referenced_cloth_ids, allowedSet);
    }
    return base;
  } catch {
    // ignore
  }

  return fallback;
}

function buildWardrobeSystemExtension(wardrobeOptions) {
  const allowed = wardrobeOptions.allowedClothIds ?? [];
  const weather = normalizeWeatherForPrompt(wardrobeOptions.weather);
  const lines = [
    'Ты AI Wardrobe, дружелюбный персональный стилист. Всегда отвечай на русском языке.',
    ...(weather
      ? [
          '',
          '## Погода сейчас (контекст)',
          ...(weather.location ? [`location=${weather.location}`] : []),
          ...(weather.temperature ? [`temperature=${weather.temperature}`] : []),
          ...(weather.feels_like ? [`feels_like=${weather.feels_like}`] : []),
          ...(weather.description ? [`description=${weather.description}`] : []),
          ...(weather.wind_speed ? [`wind_speed_kmh=${weather.wind_speed}`] : []),
          ...(weather.humidity ? [`humidity_percent=${weather.humidity}`] : []),
          'Учитывай погоду при выборе материалов/слоёв/верхней одежды и обуви.',
        ]
      : []),
    'Ниже передан каталог вещей из гардероба пользователя (каждая строка — одна вещь, у каждой есть числовой id=...).',
    'Пользователь может спрашивать, что из гардероба сочетается с чем-то — отвечай конкретно, но НЕ вставляй id и числа в текст ответа.',
    'ВАЖНО: в replyText никогда не используй шаблоны вида "id=123" и вообще не упоминай числовые id. Ссылайся по названию/категории/цвету/бренду.',
    'Если прикреплены вещи к сообщению — учитывай их в первую очередь.',
    'Не выдумывай id: используй только id из каталога или из списка разрешённых id.',
    '',
    '## Каталог гардероба',
    wardrobeOptions.wardrobeSnippet || '(пусто)',
  ];
  if (typeof wardrobeOptions.activeStyleRulesBlock === 'string' && wardrobeOptions.activeStyleRulesBlock.trim()) {
    lines.push('', wardrobeOptions.activeStyleRulesBlock.trim());
  }
  if (typeof wardrobeOptions.analyzerNotesBlock === 'string' && wardrobeOptions.analyzerNotesBlock.trim()) {
    lines.push('', wardrobeOptions.analyzerNotesBlock.trim());
  }
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

async function generateAiReply({ userId, userName, text, historyMessages, wardrobeOptions, weather }) {
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

  // RAG-правила — best-effort: не ломаем чат, если RAG недоступен.
  let activeStyleRulesBlock = null;
  let analyzerNotesBlock = null;
  let analyzerReferencedClothIds = [];
  try {
    const profile = await db.Profile.findOne({ where: { user_id: userId } });
    const filters = mapProfileAndWeatherToMetadataFilters(profile, weather);
    const retriever = await createStyleRulesRetriever({ filters, k: 4 });
    const query = buildStyleRulesQuery(profile, text, weather) || 'styling rules';
    const docs = await retriever.getRelevantDocuments(query);
    activeStyleRulesBlock = formatActiveStyleRules(docs);
  } catch {
    activeStyleRulesBlock = null;
  }

  // OpenAI-анализатор — только при useWardrobe. Best-effort.
  if (useWardrobe && allowedClothIdSet) {
    try {
      const analysis = await analyzeWardrobeForChat({
        text,
        wardrobeSnippet: wardrobeOptions.wardrobeSnippet,
        attachedSnippet: wardrobeOptions.attachedSnippet,
        allowedClothIdSet,
        weather: normalizeWeatherForPrompt(weather),
        activeStyleRulesBlock,
      });
      analyzerReferencedClothIds = Array.isArray(analysis?.referencedClothIds) ? analysis.referencedClothIds : [];
      if (analysis?.notesForWriter?.trim()) {
        analyzerNotesBlock = `## Wardrobe Analysis Notes\n${analysis.notesForWriter.trim()}`;
      }
    } catch {
      analyzerNotesBlock = null;
      analyzerReferencedClothIds = [];
    }
  }

  const system = useWardrobe
    ? {
        role: 'system',
        content: buildWardrobeSystemExtension({
          ...wardrobeOptions,
          allowedClothIds: wardrobeOptions.allowedClothIds,
          weather: normalizeWeatherForPrompt(weather),
          activeStyleRulesBlock,
          ...(analyzerNotesBlock ? { analyzerNotesBlock } : {}),
        }),
      }
    : {
        role: 'system',
        content:
          'Ты AI Wardrobe, дружелюбный персональный стилист. Всегда отвечай на русском языке.\n' +
          'Помогай пользователю собирать образы, сочетать вещи, подбирать стили под событие, погоду, сезон, настроение и особенности фигуры.\n' +
          (normalizeWeatherForPrompt(weather)
            ? '\n' +
              'Погода сейчас (контекст):\n' +
              (() => {
                const w = normalizeWeatherForPrompt(weather);
                const parts = [
                  w?.location ? `location=${w.location}` : null,
                  w?.temperature ? `temperature=${w.temperature}` : null,
                  w?.feels_like ? `feels_like=${w.feels_like}` : null,
                  w?.description ? `description=${w.description}` : null,
                  w?.wind_speed ? `wind_speed_kmh=${w.wind_speed}` : null,
                  w?.humidity ? `humidity_percent=${w.humidity}` : null,
                ].filter(Boolean);
                return parts.join('; ');
              })() +
              '\n' +
              'Учитывай погоду при рекомендациях (слои, материалы, верхняя одежда, обувь).\n'
            : '') +
          (activeStyleRulesBlock ? `\n${activeStyleRulesBlock}\n` : '') +
          'Если данных мало, сначала задай 1-2 коротких уточняющих вопроса. Если данных достаточно, предложи конкретный образ.\n' +
          'Ответ должен быть практичным: можно перечислять верх, низ, обувь, верхнюю одежду, аксессуары, цвета и объяснение, почему это сочетается.\n' +
          'Не выдумывай, что ты видишь фото или гардероб пользователя, если он этого не присылал. Сейчас работаем только с текстом, поэтому imagePrompt всегда возвращай null.\n\n' +
          'Верни результат СТРОГО в формате JSON без markdown и без комментариев по следующей схеме:\n' +
          '{"replyText":"...текст ответа...","imagePrompt":null}',
      };

  // Для режима с гардеробом вставляем правила отдельным system message перед основным system.
  const systemMessages =
    useWardrobe && activeStyleRulesBlock
      ? [{ role: 'system', content: activeStyleRulesBlock }, system]
      : [system];

  const userMsg = { role: 'user', content: `${userName}: ${text}` };
  let messages;
  if (Array.isArray(historyMessages)) {
    const safeHistory = historyMessages
      .filter((m) => m && typeof m.role === 'string' && typeof m.content === 'string')
      .slice(-HISTORY_LIMIT)
      .map((m) => ({ role: m.role, content: m.content }));
    messages = [...systemMessages, ...safeHistory, userMsg];
  } else {
    messages = [...systemMessages, ...pushHistory(userId, userMsg)];
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
    referencedClothIds:
      useWardrobe && analyzerReferencedClothIds.length
        ? analyzerReferencedClothIds
        : (payload.referencedClothIds ?? []),
  };
}

function clearHistory(userId) {
  histories.delete(userId);
}

module.exports = {
  generateAiReply,
  clearHistory,
};
