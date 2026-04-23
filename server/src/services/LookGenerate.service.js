const crypto = require('node:crypto');

const { buildStylistPrompt } = require('../utils/stylistPrompt');
const { compactItem } = require('../utils/stylistPrompt');
const { generatedLookSchema, geminiGeneratedLookJsonSchema } = require('../schemas/lookSchema');
const { geminiClient, openaiClient } = require('../config/aiConfig');
const { createStyleRulesRetriever } = require('../rag/styleRulesRetriever');
const { CATEGORY_TO_SECTION } = require('../db/utlis/category');

const db = require('../db/models');

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map();

function md5(s) {
  return crypto.createHash('md5').update(String(s)).digest('hex');
}

function getCache(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit.value;
}

function setCache(key, value) {
  cache.set(key, { at: Date.now(), value });
  if (cache.size > 500) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
}

function pickClothFields(cloth) {
  return {
    id: cloth.id,
    title: cloth.title,
    brand: cloth.brand,
    material: cloth.material,
    color: cloth.color,
    category: cloth.category,
    season: cloth.season,
    image: cloth.image,
    ai_metadata: cloth.ai_metadata,
  };
}

function clothSectionFromCategory(category) {
  const key = typeof category === 'string' ? category.trim().toLowerCase() : '';
  return (CATEGORY_TO_SECTION && key && CATEGORY_TO_SECTION[key]) || 'other';
}

function buildFallbackLookTitleFromItems(items) {
  const plain = (items ?? []).map((c) => (c && typeof c.toJSON === 'function' ? c.toJSON() : c));
  const titles = plain
    .map((c) => (c && typeof c.title === 'string' ? c.title.trim() : ''))
    .filter(Boolean)
    .slice(0, 2);

  if (titles.length >= 2) return `${titles[0]} + ${titles[1]}`;
  if (titles.length === 1) return titles[0];

  const cats = plain
    .map((c) => (c && typeof c.category === 'string' ? c.category.trim() : ''))
    .filter(Boolean)
    .slice(0, 2);
  if (cats.length >= 2) return `${cats[0]} + ${cats[1]}`;
  if (cats.length === 1) return cats[0];

  return 'Образ';
}

function formatZodError(err) {
  return {
    message: 'Validation failed',
    issues:
      err?.issues?.map((i) => ({
        path: i.path,
        message: i.message,
      })) ?? [],
  };
}

function tryUnwrapValidLookPayload(candidate, schema) {
  const queue = [candidate];
  const seen = new Set();

  while (queue.length) {
    const cur = queue.shift();
    if (!cur || typeof cur !== 'object') continue;
    if (seen.has(cur)) continue;
    seen.add(cur);

    const parsed = schema.safeParse(cur);
    if (parsed.success) return parsed.data;

    if (Array.isArray(cur)) {
      for (const v of cur) queue.push(v);
      continue;
    }

    for (const v of Object.values(cur)) {
      queue.push(v);
    }
  }

  return null;
}

function buildAiPreview(value) {
  if (value == null) return { type: String(value) };
  if (Array.isArray(value)) {
    return {
      type: 'array',
      length: value.length,
      firstItemType: value[0] == null ? String(value[0]) : typeof value[0],
    };
  }
  if (typeof value !== 'object') return { type: typeof value, sample: String(value).slice(0, 160) };

  const keys = Object.keys(value).slice(0, 25);
  const types = {};
  for (const k of keys) {
    const v = value[k];
    types[k] = Array.isArray(v) ? 'array' : v === null ? 'null' : typeof v;
  }
  return { type: 'object', keys, types };
}

function httpError(status, body) {
  const e = new Error(body?.error ?? 'HTTP error');
  e.status = status;
  e.body = body;
  return e;
}

function nonEmpty(v) {
  if (v == null) return null;
  const s = String(v).trim();
  return s ? s : null;
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


function isMostlyLatin(text) {
  const s = String(text ?? '').trim();
  if (!s) return false;
  const latin = (s.match(/[A-Za-z]/g) ?? []).length;
  const cyr = (s.match(/[А-Яа-яЁё]/g) ?? []).length;
  return latin > cyr;
}

function isMostlyCyrillic(text) {
  const s = String(text ?? '').trim();
  if (!s) return false;
  const latin = (s.match(/[A-Za-z]/g) ?? []).length;
  const cyr = (s.match(/[А-Яа-яЁё]/g) ?? []).length;
  return cyr > latin;
}

function detectUserLangFromPrompt(userPrompt) {
  const s = String(userPrompt ?? '');
  if (isMostlyCyrillic(s)) return 'ru';
  if (isMostlyLatin(s)) return 'en';
  return 'ru';
}

function buildWhyThisLookComment({ userPrompt, weather, items, allowedById }) {
  const reasons = (Array.isArray(items) ? items : [])
    .map((it) => (typeof it?.reason === 'string' ? it.reason.trim() : ''))
    .filter(Boolean)
    .slice(0, 3);
  const reasonPart = reasons.length ? `${reasons.join(' • ')}` : null;

  return reasonPart;
}

function variantInstruction(index, total) {
  if (!Number.isFinite(index) || !Number.isFinite(total) || total <= 1) return '';
  const i = index + 1;
  return [
    '',
    `Additional constraint: produce variant ${i} of ${total}.`,
    'Make it meaningfully different in style/mood/layering/colors if possible, but still realistic and using ONLY provided items.',
  ].join('\n');
}

async function generateLookTitle({ user_id, attachedClothIds }) {
  const attachedIds = Array.isArray(attachedClothIds)
    ? [...new Set(attachedClothIds.map(Number).filter(Number.isFinite))]
    : [];
  if (!attachedIds.length) {
    return { title: 'Образ', fromCache: false };
  }

  const existingUser = await db.User.findByPk(user_id);
  if (!existingUser) {
    throw new Error('Invalid session: user not found');
  }

  const clothAttrs = [
    'id',
    'title',
    'brand',
    'material',
    'color',
    'category',
    'season',
    'ai_metadata',
    'processing_status',
  ];

  const [profile, cloths] = await Promise.all([
    db.Profile.findOne({ where: { user_id } }),
    db.Cloth.findAll({
      where: { user_id, processing_status: 'completed', id: attachedIds },
      attributes: clothAttrs,
    }),
  ]);

  const byId = new Map((cloths ?? []).map((c) => [Number(c.id), c]));
  const ordered = attachedIds.map((id) => byId.get(id)).filter(Boolean);
  if (!ordered.length) {
    return { title: 'Образ', fromCache: false };
  }

  const prefs = profile?.prefs && typeof profile.prefs === 'object' ? profile.prefs : {};
  const cacheKey = md5(user_id + '::title::' + JSON.stringify(prefs) + JSON.stringify(attachedIds));
  const cached = getCache(cacheKey);
  if (cached) {
    return { title: cached, fromCache: true };
  }

  const itemsLine = ordered.map((c) => compactItem(pickClothFields(c))).join('\n');
  const prompt = [
    'You are a professional stylist.',
    'Given a list of wardrobe items (compact), invent ONE short, catchy Russian outfit name.',
    'The name should sound like a real look name (e.g. "Городской минимализм", "Тёплый casual", "Офисный smart").',
    'Avoid quotes, emoji, and overly long names.',
    'Return ONLY valid JSON: {"look_name": string}',
    '',
    '## Wardrobe items (compact)',
    itemsLine,
  ].join('\n');

  let aiJson;
  try {
    aiJson = await geminiClient.generateJson({
      prompt,
      responseSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['look_name'],
        properties: { look_name: { type: 'string', minLength: 1, maxLength: 140 } },
      },
      timeoutMs: 12000,
    });
  } catch (geminiErr) {
    try {
      aiJson = await openaiClient.generateJson({ prompt, timeoutMs: 12000 });
    } catch (openaiErr) {
      // Если AI недоступен (нет ключей/таймаут/провайдер лежит) — не валим весь endpoint.
      // Клиент всё равно умеет показывать fallback, но здесь вернём более осмысленное название.
      const finalTitle = buildFallbackLookTitleFromItems(ordered);
      setCache(cacheKey, finalTitle);
      return { title: finalTitle, fromCache: false, aiError: openaiErr?.message ?? geminiErr?.message };
    }
  }

  const title = String(aiJson?.look_name ?? '').trim();
  const finalTitle = title || 'Образ';
  setCache(cacheKey, finalTitle);
  return { title: finalTitle, fromCache: false };
}

/**
 * AI-генерация лука: кэш, Gemini → fallback GPT, Zod, транзакция Look + LookCloth.
 * @returns {{ response: object, fromCache: boolean }}
 */
async function generateLook({ user_id, userPrompt, attachedClothIds, weather, persist = true }) {
  const isDev = String(process.env.NODE_ENV || '').toLowerCase() !== 'production';
  let stage = 'init';
  let lastAiJson = null;

  const attachedIds = Array.isArray(attachedClothIds)
    ? [...new Set(attachedClothIds.map(Number).filter(Number.isFinite))]
    : [];

  stage = 'auth_user_check';
  const existingUser = await db.User.findByPk(user_id);
  if (!existingUser) {
    throw httpError(401, {
      error: 'Invalid session: user not found',
      hint: 'Re-login to get a token for an existing user.',
    });
  }

  const clothAttrs = [
    'id',
    'title',
    'brand',
    'material',
    'color',
    'category',
    'season',
    'image',
    'ai_metadata',
    'processing_status',
  ];

  stage = 'load_profile_and_items';
  const [profile, baseCloths] = await Promise.all([
    db.Profile.findOne({ where: { user_id } }),
    db.Cloth.findAll({
      where: { user_id, processing_status: 'completed' },
      limit: 30,
      order: [['updatedAt', 'DESC']],
      attributes: clothAttrs,
    }),
  ]);

  let cloths = baseCloths ?? [];
  const existingIds = new Set(cloths.map((c) => Number(c.id)));
  const missingAttached = attachedIds.filter((id) => !existingIds.has(id));
  if (missingAttached.length) {
    const extra = await db.Cloth.findAll({
      where: {
        user_id,
        processing_status: 'completed',
        id: missingAttached,
      },
      attributes: clothAttrs,
    });
    const extraById = new Map(extra.map((c) => [Number(c.id), c]));
    const orderedExtra = missingAttached.map((id) => extraById.get(id)).filter(Boolean);
    cloths = [...orderedExtra, ...cloths];
  }

  if (!cloths?.length) {
    throw httpError(400, {
      error: 'Wardrobe is empty (no completed items)',
      hint: "Make sure you have at least 1 Cloth with processing_status='completed'.",
    });
  }

  const prefs = profile?.prefs && typeof profile.prefs === 'object' ? profile.prefs : {};
  const cacheKey = md5(
    user_id +
      String(userPrompt ?? '') +
      JSON.stringify(weather ?? null) +
      JSON.stringify(prefs) +
      JSON.stringify(attachedIds.slice().sort((a, b) => a - b)),
  );
  // Preview-генерацию не кэшируем, чтобы гарантировать отсутствие побочных эффектов
  // (и чтобы случайно не вернуть ранее сохранённый look payload).
  if (persist) {
    const cached = getCache(cacheKey);
    if (cached) {
      return { response: cached, fromCache: true };
    }
  }

  stage = 'build_prompt';
  let activeStyleRules = [];
  try {
    const filters = mapProfileAndWeatherToMetadataFilters(profile, weather);
    const retriever = await createStyleRulesRetriever({ filters, k: 4 });
    const query = buildStyleRulesQuery(profile, userPrompt, weather) || 'styling rules';
    activeStyleRules = await retriever.getRelevantDocuments(query);
  } catch (e) {
    // RAG должен быть "best-effort": не валим генерацию лука из-за правил.
    activeStyleRules = [];
    if (isDev) {
      console.warn('[style-rag] failed:', e?.message || e);
    }
  }
  const prompt = buildStylistPrompt(profile, cloths.map(pickClothFields), userPrompt, {
    focusClothIds: attachedIds,
    weather,
    activeStyleRules,
  });

  stage = 'ai_gemini';
  let aiJson;
  try {
    aiJson = await geminiClient.generateJson({
      prompt,
      responseSchema: geminiGeneratedLookJsonSchema,
      timeoutMs: 15000,
    });
  } catch {
    stage = 'ai_openai_fallback';
    aiJson = await openaiClient.generateJson({
      prompt,
      timeoutMs: 15000,
    });
  }
  lastAiJson = aiJson;

  stage = 'zod_validate';
  let validated;
  try {
    const direct = generatedLookSchema.safeParse(aiJson);
    validated = direct.success
      ? direct.data
      : (tryUnwrapValidLookPayload(aiJson, generatedLookSchema) ?? generatedLookSchema.parse(aiJson));
  } catch (err) {
    if (err && err.name === 'ZodError') {
      err.stage = stage;
      err.lastAiJson = lastAiJson;
      err.isDev = isDev;
    }
    throw err;
  }

  const allowed = new Map(cloths.map((c) => [Number(c.id), c]));
  const dedup = new Map();
  for (const it of validated.items) {
    const id = Number(it.cloth_id);
    if (!allowed.has(id)) continue;
    if (!dedup.has(id)) dedup.set(id, { ...it, cloth_id: id });
  }
  for (const fid of attachedIds) {
    if (!dedup.has(fid) && allowed.has(fid)) {
      dedup.set(fid, {
        cloth_id: fid,
        role: 'piece',
        reason: 'User attached this item to the message',
      });
    }
  }
  let finalItems = Array.from(dedup.values());

  // Enforce: only one "bottom" item in a look (pants/jeans/skirt/shorts etc).
  // AI иногда возвращает несколько "низов" — отбрасываем лишнее детерминированно.
  const bottomItems = finalItems.filter((i) => {
    const c = allowed.get(Number(i.cloth_id));
    const plain = c && typeof c.toJSON === 'function' ? c.toJSON() : c;
    return clothSectionFromCategory(plain?.category) === 'bottom';
  });
  if (bottomItems.length > 1) {
    const byId = new Map(bottomItems.map((i) => [Number(i.cloth_id), i]));
    const preferredIdFromAnchored = attachedIds.find((id) => byId.has(Number(id)));
    const keepId = preferredIdFromAnchored != null ? Number(preferredIdFromAnchored) : Number(bottomItems[0].cloth_id);
    finalItems = finalItems.filter((i) => !(byId.has(Number(i.cloth_id)) && Number(i.cloth_id) !== keepId));
  }
  if (!finalItems.length) {
    throw httpError(422, {
      error: 'AI returned items not in wardrobe',
      hint: 'Try again or add more completed items to wardrobe.',
    });
  }

  // Название лука: в промте просим на языке запроса, но страхуемся, если пришло пусто.
  // Для русских запросов дополнительно страхуемся от "латиницы".
  // Уникальность для отображения в чате решается на клиенте (makeUniqueTitle).
  const userLang = detectUserLangFromPrompt(userPrompt);
  let finalLookTitle = String(validated.look_name ?? '').trim();
  if (!finalLookTitle || (userLang === 'ru' && isMostlyLatin(finalLookTitle))) {
    finalLookTitle = buildFallbackLookTitleFromItems(
      finalItems.map((i) => allowed.get(Number(i.cloth_id))).filter(Boolean),
    );
  }

  // Комментарий-пояснение (почему этот образ подходит под запрос/погоду).
  const whyComment = buildWhyThisLookComment({
    userPrompt,
    weather,
    items: finalItems,
    allowedById: allowed,
  });
  const combinedWhyComment = [whyComment].filter(Boolean).join('\n');

  stage = persist ? 'db_transaction_save' : 'format_preview_response';

  let lookPayload;
  if (persist) {
    const saved = await db.sequelize.transaction(async (t) => {
      const look = await db.Look.create(
        {
          user_id,
          title: finalLookTitle,
          metadata: {
            occasion: validated.occasion,
            item_roles: Object.fromEntries(finalItems.map((i) => [String(i.cloth_id), i.role])),
            ...(combinedWhyComment ? { why: combinedWhyComment } : {}),
          },
        },
        { transaction: t },
      );

      await db.LookCloth.bulkCreate(
        finalItems.map((i) => ({ look_id: look.id, cloth_id: i.cloth_id })),
        { transaction: t, ignoreDuplicates: true },
      );

      return look;
    });
    lookPayload = {
      id: saved.id,
      user_id: saved.user_id,
      title: saved.title,
      metadata: saved.metadata,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  } else {
    lookPayload = {
      id: 'preview',
      user_id,
      title: finalLookTitle,
      metadata: {
        occasion: validated.occasion,
        item_roles: Object.fromEntries(finalItems.map((i) => [String(i.cloth_id), i.role])),
        ...(combinedWhyComment ? { why: combinedWhyComment } : {}),
      },
    };
  }

  stage = 'format_response';
  const itemRoleById = new Map(finalItems.map((i) => [Number(i.cloth_id), i.role]));
  const response = {
    look: lookPayload,
    cloths: finalItems.map((i) => {
      const c = allowed.get(Number(i.cloth_id));
      const plain = c && typeof c.toJSON === 'function' ? c.toJSON() : c;
      return {
        ...pickClothFields(plain),
        role: itemRoleById.get(Number(i.cloth_id)) ?? i.role,
        reason: i.reason,
      };
    }),
    comment: combinedWhyComment || null,
  };

  if (persist) setCache(cacheKey, response);
  return { response, fromCache: false, isPreview: !persist };
}

async function generateLookVariant({
  user_id,
  userPrompt,
  attachedClothIds,
  weather,
  variantIndex,
  variantsTotal,
  persist = true,
}) {
  // Ровно тот же пайплайн, но добавляем instruction в userPrompt.
  const extra = variantInstruction(variantIndex, variantsTotal);
  const enrichedPrompt = [String(userPrompt ?? '').trim(), extra].filter(Boolean).join('\n');
  return generateLook({ user_id, userPrompt: enrichedPrompt, attachedClothIds, weather, persist });
}

module.exports = {
  generateLook,
  generateLookVariant,
  generateLookTitle,
  formatZodError,
  buildAiPreview,
};
