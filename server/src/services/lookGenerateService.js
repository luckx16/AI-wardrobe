const crypto = require('node:crypto');

const { buildStylistPrompt } = require('../utils/stylistPrompt');
const { generatedLookSchema, geminiGeneratedLookJsonSchema } = require('../schemas/lookSchema');
const { geminiClient, openaiClient } = require('../config/ai');

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

/**
 * AI-генерация лука: кэш, Gemini → fallback GPT, Zod, транзакция Look + LookCloth.
 * @returns {{ response: object, fromCache: boolean }}
 */
async function generateLook({ user_id, userPrompt, attachedClothIds }) {
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
      JSON.stringify(prefs) +
      JSON.stringify(attachedIds.slice().sort((a, b) => a - b)),
  );
  const cached = getCache(cacheKey);
  if (cached) {
    return { response: cached, fromCache: true };
  }

  stage = 'build_prompt';
  const prompt = buildStylistPrompt(profile, cloths.map(pickClothFields), userPrompt, {
    focusClothIds: attachedIds,
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
  const finalItems = Array.from(dedup.values());
  if (!finalItems.length) {
    throw httpError(422, {
      error: 'AI returned items not in wardrobe',
      hint: 'Try again or add more completed items to wardrobe.',
    });
  }

  stage = 'db_transaction_save';
  const saved = await db.sequelize.transaction(async (t) => {
    const look = await db.Look.create(
      {
        user_id,
        title: validated.look_name,
        metadata: {
          occasion: validated.occasion,
          item_roles: Object.fromEntries(finalItems.map((i) => [String(i.cloth_id), i.role])),
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

  stage = 'format_response';
  const itemRoleById = new Map(finalItems.map((i) => [Number(i.cloth_id), i.role]));
  const response = {
    look: {
      id: saved.id,
      user_id: saved.user_id,
      title: saved.title,
      metadata: saved.metadata,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    },
    cloths: finalItems.map((i) => {
      const c = allowed.get(Number(i.cloth_id));
      const plain = c && typeof c.toJSON === 'function' ? c.toJSON() : c;
      return {
        ...pickClothFields(plain),
        role: itemRoleById.get(Number(i.cloth_id)) ?? i.role,
        reason: i.reason,
      };
    }),
  };

  setCache(cacheKey, response);
  return { response, fromCache: false };
}

module.exports = {
  generateLook,
  formatZodError,
  buildAiPreview,
};
