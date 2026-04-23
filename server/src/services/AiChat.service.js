const { getGigaChatClient } = require('./GigaChat.service');
const { chatAiResponseSchema } = require('../schemas/chatAiResponseSchema');
const { createStyleRulesRetriever } = require('../rag/styleRulesRetriever');
const { geminiClient, openaiClient } = require('../config/aiConfig');
const db = require('../db/models');
const { analyzeWardrobeForChat } = require('./WardrobeAnalyze.service');
const { CATEGORY_TO_SECTION } = require('../db/utlis/category');

const HISTORY_LIMIT = 20;

// userId -> [{ role, content }]
const histories = new Map();

// userId -> { top?: id, bottom?: id, shoes?: id }
const lastPickedCoreByUser = new Map();
// userId -> last suggested ids (for diversity in "anchor" mode)
const lastSuggestedByUser = new Map();

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripUserNameFromReply(replyText, userName) {
  const name = String(userName ?? '').trim();
  const text = String(replyText ?? '');
  if (!name || !text) return text;

  // Удаляем упоминания имени пользователя (часто модель повторяет "Имя: ...")
  // Стараемся не ломать обычные слова: используем границы и типичные разделители.
  const re = new RegExp(
    `(^|\\n)\\s*(?:${escapeRegExp(name)}\\s*[:,-]\\s*|@${escapeRegExp(name)}\\b\\s*|${escapeRegExp(name)}\\b\\s*,\\s*)`,
    'gmi',
  );
  return text.replace(re, '$1').replace(/[ \t]+\n/g, '\n').trim();
}

function extractBrandsFromWardrobeSnippet(snippet) {
  const text = String(snippet ?? '').trim();
  if (!text) return new Set();
  const brands = new Set();
  const lines = text.split('\n');
  for (const line of lines) {
    // compactItem формат: "...;brand=Clarks;..."
    const m = String(line).match(/(?:^|;)\s*brand=([^;]+)\s*(?:;|$)/i);
    if (!m) continue;
    const brand = String(m[1] ?? '').trim();
    if (brand) brands.add(brand);
  }
  return brands;
}

function parseCompactItemLine(line) {
  const out = {};
  const s = String(line ?? '').trim();
  if (!s) return out;
  const parts = s.split(';').map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (!k) continue;
    out[k] = v;
  }
  return out;
}

function clothSectionFromCategory(category) {
  const key = typeof category === 'string' ? category.trim().toLowerCase() : '';
  return (CATEGORY_TO_SECTION && key && CATEGORY_TO_SECTION[key]) || 'other';
}

function pickRandomOne(arr) {
  const list = Array.isArray(arr) ? arr : [];
  if (!list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}

function pickWithNoImmediateRepeat(candidates, lastId) {
  const list = Array.isArray(candidates) ? candidates.map(Number).filter(Number.isFinite) : [];
  if (!list.length) return null;
  if (list.length === 1) return list[0];
  const filtered = lastId != null ? list.filter((id) => Number(id) !== Number(lastId)) : list;
  const pool = filtered.length ? filtered : list;
  return pool[Math.floor(Math.random() * pool.length)];
}

function pickAlternativeIfRepeated(currentId, candidates, lastId) {
  const cur = currentId != null ? Number(currentId) : null;
  const last = lastId != null ? Number(lastId) : null;
  if (cur == null || last == null) return cur;
  if (cur !== last) return cur;
  const alt = pickWithNoImmediateRepeat(candidates, last);
  return alt != null ? alt : cur;
}

function ensureLookCoreIds({ userId, ids, compactById }) {
  const base = Array.isArray(ids) ? [...new Set(ids.map(Number).filter(Number.isFinite))] : [];

  const sectionById = new Map();
  for (const id of base) {
    const row = compactById.get(Number(id));
    const cat = row?.cat ?? row?.category ?? '';
    sectionById.set(Number(id), clothSectionFromCategory(cat));
  }

  const candidatesBySection = new Map([
    ['top', []],
    ['bottom', []],
    ['shoes', []],
  ]);
  for (const [id, row] of compactById.entries()) {
    const section = clothSectionFromCategory(row?.cat ?? row?.category ?? '');
    if (!candidatesBySection.has(section)) continue;
    candidatesBySection.get(section).push(Number(id));
  }

  // Гарантируем базу лука: top + bottom + shoes (если такие секции вообще есть в гардеробе).
  // Если анализатор выбрал 3 вещи, но обуви нет — заменяем одну НЕ-базовую вещь на обувь.
  const pickExisting = (section) => {
    for (const [id, sec] of sectionById.entries()) {
      if (sec === section) return Number(id);
    }
    return null;
  };

  const last = userId != null ? (lastPickedCoreByUser.get(String(userId)) ?? {}) : {};
  let chosenTop =
    pickExisting('top') ?? pickWithNoImmediateRepeat(candidatesBySection.get('top'), last.top);
  let chosenBottom =
    pickExisting('bottom') ?? pickWithNoImmediateRepeat(candidatesBySection.get('bottom'), last.bottom);
  let chosenShoes =
    pickExisting('shoes') ?? pickWithNoImmediateRepeat(candidatesBySection.get('shoes'), last.shoes);

  // Если анализатор вернул обувь, но она повторяется подряд — меняем на альтернативу (если есть).
  chosenShoes = pickAlternativeIfRepeated(chosenShoes, candidatesBySection.get('shoes'), last.shoes);

  // Если обуви (или другой секции) в гардеробе нет — вернём то, что есть (дальше текст попросит добавить).
  const core = [chosenTop, chosenBottom, chosenShoes].filter((v) => v != null);
  const out = [...new Set(core.map(Number).filter(Number.isFinite))].slice(0, 3);

  if (userId != null) {
    const next = {
      top: chosenTop ?? last.top,
      bottom: chosenBottom ?? last.bottom,
      shoes: chosenShoes ?? last.shoes,
    };
    lastPickedCoreByUser.set(String(userId), next);
  }
  return out;
}

function pickComplementItemIds({ userId, anchorCompact, compactById, count = 3 }) {
  const anchorCat = String(anchorCompact?.cat ?? anchorCompact?.category ?? '').trim().toLowerCase();
  const grouped = new Map(); // category -> [id]

  for (const [id, row] of compactById.entries()) {
    const cat = String(row?.cat ?? row?.category ?? '').trim().toLowerCase();
    if (!cat) continue;
    if (anchorCat && cat === anchorCat) continue;
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat).push(Number(id));
  }

  const cats = Array.from(grouped.keys());
  if (!cats.length) return [];

  const prev = userId != null ? (lastSuggestedByUser.get(String(userId)) ?? []) : [];
  const prevSet = new Set(prev.map(Number).filter(Number.isFinite));

  const pickedCats = [];
  const poolCats = cats.slice();
  while (poolCats.length && pickedCats.length < count) {
    const idx = Math.floor(Math.random() * poolCats.length);
    pickedCats.push(poolCats.splice(idx, 1)[0]);
  }

  const out = [];
  for (const cat of pickedCats) {
    const ids = grouped.get(cat) ?? [];
    if (!ids.length) continue;
    const noRepeat = ids.filter((id) => !prevSet.has(Number(id)));
    const pickPool = noRepeat.length ? noRepeat : ids;
    const pick = pickPool[Math.floor(Math.random() * pickPool.length)];
    if (pick != null) out.push(Number(pick));
  }

  const uniq = [...new Set(out)].slice(0, count);
  if (userId != null) lastSuggestedByUser.set(String(userId), uniq);
  return uniq;
}

function buildCompactById(snippet) {
  const map = new Map();
  const lines = String(snippet ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  for (const line of lines) {
    const m = line.match(/\bid=(\d+)\b/);
    if (!m) continue;
    const id = Number(m[1]);
    if (!Number.isFinite(id)) continue;
    map.set(id, parseCompactItemLine(line));
  }
  return map;
}

function normalizeTextForMatch(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isIdMentionedInReply(replyText, compact) {
  const text = normalizeTextForMatch(replyText);
  if (!text) return false;

  const title = normalizeTextForMatch(compact?.title);
  const color = normalizeTextForMatch(compact?.color);
  const cat = normalizeTextForMatch(compact?.cat ?? compact?.category);

  // Считаем вещь "упомянутой", если совпало либо название целиком,
  // либо категория+цвет (цвет может быть составной: "серо-голубой").
  if (title && title.length >= 4 && text.includes(title)) return true;
  if (cat && color && cat.length >= 3 && color.length >= 3) {
    if (text.includes(cat) && text.includes(color)) return true;
  }
  return false;
}

function replaceNonAttachedTitles(replyText, compactById, attachedIds) {
  const set = new Set((attachedIds ?? []).map(Number).filter(Number.isFinite));
  let out = String(replyText ?? '');
  if (!out.trim()) return out;

  for (const [id, compact] of compactById.entries()) {
    if (set.has(id)) continue;
    const title = String(compact?.title ?? '').trim();
    if (!title) continue;
    // Убираем точные совпадения title (как "Максимус"), чтобы в тексте не оставались неприкреплённые вещи.
    const re = new RegExp(`\\b${escapeRegExp(title)}\\b`, 'gi');
    out = out.replace(re, '').replace(/[ \t]{2,}/g, ' ');
  }
  return out
    .replace(/[ \t]+\n/g, '\n')
    .replace(/[ \t]+([,.;:!?])/g, '$1')
    .replace(/\(\s*\)/g, '')
    .trim();
}

function stripBrandsFromReply(replyText, brands) {
  const text = String(replyText ?? '');
  if (!text) return text;
  const set = brands instanceof Set ? brands : new Set(Array.isArray(brands) ? brands : []);
  if (!set.size) return text;

  let out = text;
  for (const b of set) {
    const brand = String(b ?? '').trim();
    if (!brand) continue;
    // Удаляем вхождения бренда как отдельного слова/фразы (без учёта регистра).
    // Пример: "ботинки Clarks" -> "ботинки", "Clarks," -> ""
    const re = new RegExp(`\\b${escapeRegExp(brand)}\\b`, 'gi');
    out = out.replace(re, '').replace(/[ \t]{2,}/g, ' ');
  }

  // Подчищаем хвостовые пробелы и пробелы перед пунктуацией.
  return out
    .replace(/[ \t]+\n/g, '\n')
    .replace(/[ \t]+([,.;:!?])/g, '$1')
    .replace(/\(\s*\)/g, '')
    .trim();
}

function toBulletedSentences(text) {
  const s = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (!s) return '';
  // Убираем существующие маркеры, чтобы не дублировать.
  const cleaned = s.replace(/•/g, '').trim();
  const parts = cleaned.split(/(?<=[.!?])\s+/).map((p) => p.trim()).filter(Boolean);
  if (!parts.length) return '';
  return parts.map((p) => `• ${p}`).join('\n');
}

function describeWardrobeItem(compact) {
  if (!compact || typeof compact !== 'object') return 'вещь из гардероба';
  const cat = String(compact.cat ?? compact.category ?? '').trim();
  const color = String(compact.color ?? '').trim();
  const mat = String(compact.mat ?? compact.material ?? '').trim();

  // Важно: не используем title/brand вообще, чтобы не проскочили бренды/модели.
  const parts = [];
  if (color) parts.push(color);
  if (cat) parts.push(cat);
  if (mat) parts.push(`(${mat})`);
  return parts.length ? parts.join(' ') : 'вещь из гардероба';
}

async function generateWardrobeAnchoredCommentAi({ anchorCompact, itemsCompact, userText, weather }) {
  const anchorText = anchorCompact ? describeWardrobeItem(anchorCompact) : null;
  const itemTexts = (itemsCompact ?? []).map((c) => describeWardrobeItem(c)).filter(Boolean);
  if (!itemTexts.length) return null;
  if (!anchorText) return null;

  const prompt = [
    'You are a fashion stylist.',
    'Write a natural, non-template Russian comment (3–6 sentences).',
    `Task: explain ONLY how each selected item matches the anchored item: ${anchorText}.`,
    'Do NOT explain why items match each other. Only anchored-item compatibility.',
    'Do NOT mention any brands or model names.',
    'Do NOT mention any items that are not in the provided list.',
    'IMPORTANT: This is NOT a full outfit. These are example items that can be worn with the anchored item.',
    'Be practical and specific, but keep it short.',
    '',
    `User message: ${String(userText ?? '').trim() || '(empty)'}`,
    weather ? `Weather: ${JSON.stringify(weather)}` : '',
    '',
    'Items that can be mentioned (only these):',
    ...itemTexts.map((t) => `- ${t}`),
    '',
    'Return ONLY valid JSON: {"replyText": string}',
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const aiJson = await geminiClient.generateJson({
      prompt,
      responseSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['replyText'],
        properties: { replyText: { type: 'string', minLength: 1, maxLength: 700 } },
      },
      timeoutMs: 12000,
      generationConfig: { temperature: 1.25, topP: 0.92 },
    });
    const t = String(aiJson?.replyText ?? '').trim();
    return t || null;
  } catch {
    // fall through
  }
  try {
    const aiJson = await openaiClient.generateJson({ prompt, timeoutMs: 12000, temperature: 1.1 });
    const t = String(aiJson?.replyText ?? '').trim();
    return t || null;
  } catch {
    return null;
  }
}

function buildMatchHint(anchor, other) {
  const aColor = String(anchor?.color ?? '').trim();
  const oColor = String(other?.color ?? '').trim();
  const aMat = String(anchor?.mat ?? anchor?.material ?? '').trim().toLowerCase();
  const oMat = String(other?.mat ?? other?.material ?? '').trim().toLowerCase();
  const oCat = String(other?.cat ?? other?.category ?? '').trim().toLowerCase();

  if (aColor && oColor && aColor.toLowerCase() === oColor.toLowerCase()) {
    return 'Цвета поддерживают друг друга, образ выглядит цельно.';
  }
  if (oCat.includes('жакет') || oCat.includes('пиджак')) {
    return 'Добавляет структуру и собирает образ, хорошо балансирует базу.';
  }
  if (oCat.includes('джинс') || oCat.includes('брюк') || oCat.includes('юбк')) {
    return 'Даёт читаемую линию низа и поддерживает силуэт.';
  }
  if ((aMat.includes('шелк') || aMat.includes('шёлк')) && (oMat.includes('деним') || oMat.includes('джинс'))) {
    return 'Контраст фактур (гладкий верх и более плотный низ) делает образ интереснее.';
  }
  return 'Сочетается по нейтральной базе и работает за счёт баланса цвета и фактуры.';
}

function buildRuleCompliantReplyText(attachedIds, compactById, anchorId) {
  const ids = Array.isArray(attachedIds) ? attachedIds.map(Number).filter(Number.isFinite) : [];
  if (!ids.length) {
    return [
      'Я могу упоминать только те вещи, которые прикрепляю к ответу.',
      'Сейчас подходящих вещей не выбрано, поэтому не буду называть конкретные позиции.',
      'Прикрепи 1–3 вещи из гардероба (например: верх, низ, обувь) — и я соберу сочетание строго по ним.',
    ].join('\n');
  }

  const sections = ids.map((id) => {
    const row = compactById?.get?.(Number(id));
    return clothSectionFromCategory(row?.cat ?? row?.category ?? '');
  });
  const have = new Set(sections);
  const missingCore = ['top', 'bottom', 'shoes'].filter((s) => !have.has(s));
  if (missingCore.length) {
    return [
      'Чтобы собрать полноценный лук, нужны как минимум верх, низ и обувь.',
      `Сейчас в прикреплённых вещах не хватает: ${missingCore.join(', ')}.`,
      'Прикрепи недостающие позиции (1–2 вещи), и я соберу лук строго из прикреплённых.',
    ].join('\n');
  }

  const bySection = new Map();
  for (const id of ids) {
    const row = compactById?.get?.(Number(id));
    const section = clothSectionFromCategory(row?.cat ?? row?.category ?? '');
    if (!bySection.has(section)) bySection.set(section, []);
    bySection.get(section).push({ id, row });
  }

  const anchor = anchorId != null ? compactById?.get?.(Number(anchorId)) : null;
  const anchorInReply = anchor && ids.includes(Number(anchorId)) ? anchor : null;
  const anchorRow = anchorInReply ?? bySection.get('top')?.[0]?.row ?? bySection.get('bottom')?.[0]?.row ?? bySection.get('shoes')?.[0]?.row;

  const top = bySection.get('top')?.[0]?.row;
  const bottom = bySection.get('bottom')?.[0]?.row;
  const shoes = bySection.get('shoes')?.[0]?.row;

  const items = [
    { section: 'top', row: top },
    { section: 'bottom', row: bottom },
    { section: 'shoes', row: shoes },
  ].filter((x) => x.row);

  const intro = anchorInReply
    ? `Беру за основу ${describeWardrobeItem(anchorInReply)} и собираю сочетание только из прикреплённых вещей.`
    : 'Собрала сочетание только из прикреплённых вещей.';

  const listLines = items.map((it) => `• ${describeWardrobeItem(it.row)}`);

  const whyLines = items
    .filter((it) => it.row && it.row !== anchorRow)
    .map((it) => `• ${describeWardrobeItem(it.row)}: ${buildMatchHint(anchorRow, it.row)}`);

  // Если якорь почему-то совпал со всеми (крайний случай) — дадим общий смысл.
  const finalWhy = whyLines.length
    ? whyLines
    : ['• Сочетание работает за счёт согласованных цветов и баланса фактур между верхом, низом и обувью.'];

  return [intro, '', ...listLines, '', 'Почему вещи сочетаются с твоей базовой вещью:', ...finalWhy].join('\n').trim();
}

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

function stripReplyTextEnvelope(s) {
  const input = String(s ?? '').trim();
  const prefix = '{"replyText":"';
  const suffix = '","imagePrompt":null}';
  if (input.startsWith(prefix) && input.endsWith(suffix) && input.length >= prefix.length + suffix.length) {
    return input.slice(prefix.length, input.length - suffix.length);
  }
  return input;
}

function normalizeBulletLines(text) {
  const s = String(text ?? '');
  if (!s) return s;
  // Если модель склеила пункты через "•" в одну строку — делаем список,
  // где КАЖДЫЙ пункт начинается с "•" и идёт с новой строки.
  // Пример: "A. • B. • C." -> "• A.\n• B.\n• C."
  if (s.includes('•')) {
    const parts = s
      .split('•')
      .map((p) => p.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    if (parts.length >= 2) {
      return parts.map((p) => `• ${p}`).join('\n');
    }
  }

  // Фолбэк: просто переносим каждый "•" на новую строку.
  return s.replace(/[ \t]*•[ \t]*/g, '\n• ').replace(/^\n+/, '');
}

function extractJsonPayload(answer, wardrobeOptions) {
  const allowedSet = wardrobeOptions?.allowedClothIdSet ?? null;
  const fallback = {
    replyText: normalizeBulletLines(stripReplyTextEnvelope(answer?.trim?.() ?? '...')),
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
      replyText: normalizeBulletLines(data.replyText),
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
    'ВАЖНО: никогда не обращайся к пользователю по имени и не повторяй его имя/ник в replyText.',
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
    'КРИТИЧЕСКОЕ ОГРАНИЧЕНИЕ: любые КОНКРЕТНЫЕ вещи (из гардероба) можно упоминать ТОЛЬКО из блока "Выбранные вещи для ответа".',
    'Если в блоке "Выбранные вещи для ответа" пусто — ЗАПРЕЩЕНО упоминать конкретные вещи из гардероба; можно давать только общие рекомендации по категориям/цветам/материалам.',
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
  // Всегда показываем "выбранные вещи" (даже если пусто), чтобы модель не уносило в произвольные упоминания.
  const selectedBlock =
    typeof wardrobeOptions.selectedItemsBlock === 'string' && wardrobeOptions.selectedItemsBlock.trim()
      ? wardrobeOptions.selectedItemsBlock.trim()
      : '## Выбранные вещи для ответа (ТОЛЬКО их можно упоминать как конкретные вещи)\n(нет)';
  lines.push('', selectedBlock);
  lines.push(
    '',
    'ПРАВИЛО СООТВЕТСТВИЯ: в replyText ты ОБЯЗАН(А) упомянуть каждую вещь из блока "Выбранные вещи для ответа" (по названию/описанию БЕЗ бренда) и НЕ ИМЕЕШЬ ПРАВА упоминать какие-либо другие конкретные вещи.',
    'Если блок пуст — не упоминай конкретные вещи; формулируй рекомендации только общими словами (категория/цвет/материал).',
  );
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
      } else {
        // Жёстко запрещаем упоминания конкретных вещей: если анализатор не выбрал items,
        // не даём модели "allowed id" и показываем пустой selected block.
        allowedClothIdsForReply = [];
        selectedItemsBlock = null;
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

  // Не передаём имя пользователя модели, чтобы она не повторяла его в ответе.
  const userMsg = { role: 'user', content: String(text ?? '').trim() };
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
  payload.replyText = stripUserNameFromReply(payload.replyText, userName);
  if (useWardrobe) {
    const compactById = new Map();
    for (const src of [wardrobeOptions?.wardrobeSnippet, wardrobeOptions?.attachedSnippet]) {
      const m = buildCompactById(src);
      for (const [id, row] of m.entries()) compactById.set(id, row);
    }

    const brands = new Set();
    for (const src of [wardrobeOptions?.wardrobeSnippet, wardrobeOptions?.attachedSnippet]) {
      for (const b of extractBrandsFromWardrobeSnippet(src)) brands.add(b);
    }
    payload.replyText = stripBrandsFromReply(payload.replyText, brands);

    const anchorId = Array.isArray(wardrobeOptions?.attachedClothIds) && wardrobeOptions.attachedClothIds.length
      ? Number(wardrobeOptions.attachedClothIds[0])
      : null;

    const anchorCompact = anchorId != null ? compactById.get(Number(anchorId)) : null;
    if (anchorCompact) {
      analyzerReferencedClothIds = pickComplementItemIds({
        userId,
        anchorCompact,
        compactById,
        count: 3,
      });
    } else {
      analyzerReferencedClothIds = ensureLookCoreIds({
        userId,
        ids: analyzerReferencedClothIds,
        compactById,
      });
    }
    const itemsCompact = analyzerReferencedClothIds
      .map((id) => compactById.get(Number(id)))
      .filter(Boolean);

    // Сначала пробуем "живой" комментарий от AI (как в генерации лука),
    // но строго ограничиваемся только прикреплёнными вещами.
    const aiText = await generateWardrobeAnchoredCommentAi({
      anchorCompact,
      itemsCompact,
      userText: text,
      weather: normalizeWeatherForPrompt(weather),
    });

    // Если AI недоступен у всех провайдеров
    // Возвращаем короткое сообщение и предлагаем повторить запрос.
    payload.replyText =
      aiText ||
      (anchorCompact
        ? 'Не получилось сгенерировать комментарий к сочетанию прямо сейчас. Попробуй отправить сообщение ещё раз.'
        : 'Прикрепи одну базовую вещь (с которой нужно сочетать) — и я дам комментарий, как выбранные вещи сочетаются именно с ней.');

    // Финальная зачистка брендов (на случай, если модель всё-таки их вставит).
    payload.replyText = stripBrandsFromReply(payload.replyText, brands);
    payload.replyText = toBulletedSentences(payload.replyText);
  }

  if (!Array.isArray(historyMessages)) {
    pushHistory(userId, { role: 'assistant', content: payload.replyText });
  }

  return {
    replyText: payload.replyText,
    imagePrompt: payload.imagePrompt,
    referencedClothIds:
      // Всегда прикрепляем ровно те вещи, которые прошли через анализатор (а не то, что "придумала" модель).
      // Так выполняется правило: если вещь упомянута как конкретная — она обязана быть прикреплена.
      useWardrobe ? analyzerReferencedClothIds : (payload.referencedClothIds ?? []),
  };
}

function clearHistory(userId) {
  histories.delete(userId);
}

module.exports = {
  generateAiReply,
  clearHistory,
};
