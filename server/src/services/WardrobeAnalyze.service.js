const { openaiClient } = require('../config/aiConfig');
const { wardrobeAnalyzeSchema } = require('../schemas/wardrobeAnalyzeSchema');
const crypto = require('node:crypto');

function normalizeReferencedIds(raw, allowedSet) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const v of raw) {
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) continue;
    if (allowedSet && !allowedSet.has(n)) continue;
    if (!out.includes(n)) out.push(n);
  }
  return out;
}

async function analyzeWardrobeForChat({
  text,
  wardrobeSnippet,
  attachedSnippet,
  allowedClothIdSet,
  weather,
  activeStyleRulesBlock,
}) {
  const nonce = crypto.randomBytes(6).toString('hex');
  const prompt = [
    'You are a strict fashion assistant that returns ONLY valid JSON.',
    'Task: given wardrobe items and the user message, pick which wardrobe items to reference in the answer.',
    'Return JSON with keys: referenced_cloth_ids (array of integers), notes_for_writer (string or null).',
    'Do not include any extra keys.',
    'IMPORTANT: pick AT MOST 3 item ids.',
    `Randomization token (use it only to break ties and increase variety across replies): ${nonce}`,
    'DIVERSITY RULE: if multiple equally good options exist (especially shoes), prefer a different choice than the most obvious/default one.',
    'LOOK RULE: if the user asks to build an outfit/look, and the wardrobe contains them, pick exactly 3 items: one TOP, one BOTTOM and one SHOES.',
    'If some of these sections are missing in the wardrobe, pick the best possible alternative, but still keep max 3 ids.',
    '',
    activeStyleRulesBlock ? String(activeStyleRulesBlock).trim() : '',
    weather ? `## Weather\n${JSON.stringify(weather)}` : '',
    '## Wardrobe (compact, each line includes id=...)',
    String(wardrobeSnippet ?? '').trim() || '(empty)',
    attachedSnippet?.trim() ? `\n## Attached to this message\n${attachedSnippet.trim()}` : '',
    '',
    '## User message',
    String(text ?? '').trim(),
  ]
    .filter(Boolean)
    .join('\n');

  let aiJson;
  try {
    aiJson = await openaiClient.generateJson({ prompt, timeoutMs: 12000 });
  } catch (e) {
    return { referencedClothIds: [], notesForWriter: null, aiError: e?.message ?? e };
  }

  const validated = wardrobeAnalyzeSchema.safeParse(aiJson);
  if (!validated.success) {
    return { referencedClothIds: [], notesForWriter: null, aiError: 'Invalid analyzer response' };
  }

  const data = validated.data;
  const ids = normalizeReferencedIds(data.referenced_cloth_ids, allowedClothIdSet).slice(0, 3);
  return { referencedClothIds: ids, notesForWriter: data.notes_for_writer ?? null };
}

module.exports = {
  analyzeWardrobeForChat,
};

