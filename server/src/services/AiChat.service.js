const { getGigaChatClient } = require('./GigaChat.service');
const { chatAiResponseSchema } = require('../schemas/chatAiResponseSchema');
const { createStyleRulesRetriever } = require('../rag/styleRulesRetriever');
const db = require('../db/models');
const { analyzeWardrobeForChat } = require('./WardrobeAnalyze.service');

const HISTORY_LIMIT = 20;

// userId -> [{ role, content }]
const histories = new Map();

function detectReplyLanguage(text) {
  const s = String(text ?? '');
  const han = (s.match(/[\u3400-\u4DBF\u4E00-\u9FFF]/g) ?? []).length; // Chinese Han ideographs
  const cyr = (s.match(/[А-Яа-яЁё]/g) ?? []).length;
  const latin = (s.match(/[A-Za-z]/g) ?? []).length;
  if (han > 0 && han >= cyr && han >= latin) return { code: 'zh', label: 'китайском' };
  if (cyr > latin) return { code: 'ru', label: 'русском' };
  if (latin > cyr) {
    // Fast heuristics for DE/FR/ES based on common diacritics/punctuation.
    if (/[äöüßÄÖÜ]/.test(s)) return { code: 'de', label: 'немецком' };
    if (/[ñÑ¿¡áéíóúüÁÉÍÓÚÜ]/.test(s)) return { code: 'es', label: 'испанском' };
    if (/[àâæçèéêëîïôœùûüÿÀÂÆÇÈÉÊËÎÏÔŒÙÛÜŸ]/.test(s)) return { code: 'fr', label: 'французском' };
    return { code: 'en', label: 'английском' };
  }
  return { code: 'ru', label: 'русском' };
}

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
  const knownProfileFields = ['skin_tone', 'proportion', 'contrast', 'height', 'wishes', 'additions'];
  for (const k of knownProfileFields) {
    if (p && typeof p[k] === 'string' && p[k].trim()) filters[k] = p[k].trim();
  }
  // dislikes в профиле могут быть объектом/списком — кладём JSON (ограничиваем длину, чтобы не раздувать метаданные).
  if (p && typeof p.dislikes === 'object' && p.dislikes) {
    try {
      const json = JSON.stringify(p.dislikes);
      if (json && json !== '{}' && json !== '[]') {
        filters.dislikes = json.slice(0, 600);
      }
    } catch {
      // ignore
    }
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
  const dislikes =
    p && typeof p.dislikes === 'object' && p.dislikes && Object.keys(p.dislikes).length
      ? JSON.stringify(p.dislikes)
      : '';
  const parts = [
    typeof userPrompt === 'string' ? userPrompt.trim() : '',
    typeof p?.wishes === 'string' ? p.wishes.trim() : '',
    typeof p?.additions === 'string' ? p.additions.trim() : '',
    dislikes,
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
  return out.slice(0, 3);
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

function pickWardrobeLinesByIds(snippet, ids) {
  const lines = String(snippet ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return '';
  const wanted = new Set((ids ?? []).map(Number).filter(Number.isFinite));
  if (!wanted.size) return '';
  const out = [];
  for (const line of lines) {
    const m = line.match(/\bid=(\d+)\b/);
    if (!m) continue;
    const id = Number(m[1]);
    if (wanted.has(id)) out.push(line);
  }
  return out.join('\n');
}

function buildWardrobeSystemExtension(wardrobeOptions) {
  const lang = wardrobeOptions?.replyLanguage ?? { code: 'ru', label: 'русском' };
  const allowed = wardrobeOptions.allowedClothIds ?? [];
  const weather = normalizeWeatherForPrompt(wardrobeOptions.weather);
  const profile =
    wardrobeOptions?.profile && typeof wardrobeOptions.profile.toJSON === 'function'
      ? wardrobeOptions.profile.toJSON()
      : (wardrobeOptions?.profile ?? {});
  const lines = [
    `Ты AI Wardrobe, дружелюбный персональный стилист. Отвечай на ${lang.label} языке (языке запроса пользователя).`,
    ...(profile && typeof profile === 'object'
      ? [
          '',
          '## Профиль пользователя (учитывай в подборе)',
          ...(nonEmpty(profile.skin_tone) ? [`skin_tone=${nonEmpty(profile.skin_tone)}`] : []),
          ...(nonEmpty(profile.contrast) ? [`contrast=${nonEmpty(profile.contrast)}`] : []),
          ...(nonEmpty(profile.height) ? [`height=${nonEmpty(profile.height)}`] : []),
          ...(nonEmpty(profile.proportion) ? [`proportion=${nonEmpty(profile.proportion)}`] : []),
          ...(nonEmpty(profile.wishes) ? [`wishes=${nonEmpty(profile.wishes)}`] : []),
          ...(profile.dislikes && typeof profile.dislikes === 'object' && Object.keys(profile.dislikes).length
            ? [`dislikes=${JSON.stringify(profile.dislikes)}`]
            : []),
          ...(nonEmpty(profile.additions) ? [`additions=${nonEmpty(profile.additions)}`] : []),
        ]
      : []),
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
    'ВАЖНО: в replyText НИКОГДА не упоминай бренды. Даже если бренд есть в данных — опускай его. Пиши только тип/цвет/материал/фасон.',
    'ВАЖНО: в одном ответе можно упомянуть максимум 3 конкретные вещи из гардероба.',
    'Если прикреплены вещи к сообщению — учитывай их в первую очередь.',
    'Не выдумывай id: используй только id из каталога или из списка разрешённых id.',
    'КРИТИЧЕСКОЕ ОГРАНИЧЕНИЕ: если ты предлагаешь КОНКРЕТНУЮ вещь (бренд/модель/точное название), она должна быть из блока "Выбранные вещи для ответа".',
    'Если подходящих вещей нет — не называй конкретные вещи, а дай общую рекомендацию по категориям/цветам/материалам.',
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
  if (typeof wardrobeOptions.selectedItemsBlock === 'string' && wardrobeOptions.selectedItemsBlock.trim()) {
    lines.push('', wardrobeOptions.selectedItemsBlock.trim());
    lines.push(
      '',
      'ПРАВИЛО СООТВЕТСТВИЯ: в replyText ты ОБЯЗАН(А) упомянуть каждую вещь из блока "Выбранные вещи для ответа" (по названию/описанию БЕЗ бренда) и НЕ ИМЕЕШЬ ПРАВА упоминать какие-либо другие конкретные вещи.',
      'Если хочется предложить что-то ещё — формулируй это общими словами (категория/цвет/материал) без конкретных названий.',
    );
  }
  if (wardrobeOptions.attachedSnippet?.trim()) {
    lines.push('', '## Прикреплено к этому сообщению', wardrobeOptions.attachedSnippet.trim());
  }
  lines.push(
    '',
    'Верни результат СТРОГО в формате JSON без markdown и без комментариев:',
    '{"replyText":"...","imagePrompt":null,"referenced_cloth_ids":[числа]}',
    'referenced_cloth_ids — массив id вещей из каталога, которые ты УПОМИНАЕШЬ как конкретные вещи в replyText.',
    'СТРОГОЕ ПРАВИЛО: referenced_cloth_ids должен соответствовать конкретным вещам, которые реально упомянуты в replyText. Если id в массиве — вещь должна быть упомянута. Если вещь упомянута — её id должен быть в массиве.',
    'ЛИМИТ: referenced_cloth_ids длиной максимум 3.',
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

  const replyLanguage = detectReplyLanguage(text);
  const useWardrobe = Boolean(wardrobeOptions?.wardrobeSnippet && wardrobeOptions?.allowedClothIds?.length);
  const allowedClothIdSet = useWardrobe
    ? new Set(wardrobeOptions.allowedClothIds.map(Number).filter(Number.isFinite))
    : null;

  // Профиль — используем и для RAG-фильтров/запроса, и для явного контекста в system prompt.
  let profile = null;
  try {
    profile = await db.Profile.findOne({ where: { user_id: userId } });
  } catch {
    profile = null;
  }

  // RAG-правила — best-effort: не ломаем чат, если RAG недоступен.
  let activeStyleRulesBlock = null;
  let analyzerNotesBlock = null;
  let analyzerReferencedClothIds = [];
  try {
    const filters = mapProfileAndWeatherToMetadataFilters(profile, weather);
    const retriever = await createStyleRulesRetriever({ filters, k: 4 });
    const query = buildStyleRulesQuery(profile, text, weather) || 'styling rules';
    const docs = await retriever.getRelevantDocuments(query);
    activeStyleRulesBlock = formatActiveStyleRules(docs);
  } catch {
    activeStyleRulesBlock = null;
  }

  // OpenAI-анализатор — только при useWardrobe. Best-effort.
  let selectedItemsBlock = null;
  let allowedClothIdsForReply = wardrobeOptions?.allowedClothIds ?? [];
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
      if (analyzerReferencedClothIds.length) {
        allowedClothIdsForReply = analyzerReferencedClothIds.slice();
        const selectedLines = pickWardrobeLinesByIds(
          [wardrobeOptions.wardrobeSnippet, wardrobeOptions.attachedSnippet].filter(Boolean).join('\n'),
          analyzerReferencedClothIds,
        );
        if (selectedLines.trim()) {
          selectedItemsBlock = [
            '## Выбранные вещи для ответа (ТОЛЬКО их можно упоминать как конкретные вещи)',
            selectedLines.trim(),
          ].join('\n');
        }
      }
    } catch {
      analyzerNotesBlock = null;
      analyzerReferencedClothIds = [];
      selectedItemsBlock = null;
      allowedClothIdsForReply = wardrobeOptions?.allowedClothIds ?? [];
    }
  }

  const system = useWardrobe
    ? {
        role: 'system',
        content: buildWardrobeSystemExtension({
          ...wardrobeOptions,
          profile,
          replyLanguage,
          allowedClothIds: allowedClothIdsForReply,
          weather: normalizeWeatherForPrompt(weather),
          activeStyleRulesBlock,
          ...(analyzerNotesBlock ? { analyzerNotesBlock } : {}),
          ...(selectedItemsBlock ? { selectedItemsBlock } : {}),
        }),
      }
    : {
        role: 'system',
        content:
          `Ты AI Wardrobe, дружелюбный персональный стилист. Отвечай на ${replyLanguage.label} языке (языке запроса пользователя).\n` +
          'Помогай пользователю собирать образы, сочетать вещи, подбирать стили под событие, погоду, сезон, настроение и особенности фигуры.\n' +
          'ВАЖНО: никогда не упоминай бренды в ответе. Используй только тип/цвет/материал/фасон.\n' +
          (profile
            ? '\n' +
              'Профиль пользователя (учитывай в подборе):\n' +
              (() => {
                const p = profile && typeof profile.toJSON === 'function' ? profile.toJSON() : (profile ?? {});
                const dislikes =
                  p && typeof p.dislikes === 'object' && p.dislikes && Object.keys(p.dislikes).length
                    ? JSON.stringify(p.dislikes)
                    : '';
                const parts = [
                  nonEmpty(p?.skin_tone) ? `skin_tone=${nonEmpty(p.skin_tone)}` : null,
                  nonEmpty(p?.contrast) ? `contrast=${nonEmpty(p.contrast)}` : null,
                  nonEmpty(p?.height) ? `height=${nonEmpty(p.height)}` : null,
                  nonEmpty(p?.proportion) ? `proportion=${nonEmpty(p.proportion)}` : null,
                  nonEmpty(p?.wishes) ? `wishes=${nonEmpty(p.wishes)}` : null,
                  dislikes ? `dislikes=${dislikes}` : null,
                  nonEmpty(p?.additions) ? `additions=${nonEmpty(p.additions)}` : null,
                ].filter(Boolean);
                return parts.join('; ');
              })() +
              '\n'
            : '') +
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
