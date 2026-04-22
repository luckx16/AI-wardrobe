function safeJson(v) {
  try {
    return JSON.stringify(v ?? null);
  } catch {
    return 'null';
  }
}

function compactItem(i) {
  const meta = i.ai_metadata && typeof i.ai_metadata === 'object' ? i.ai_metadata : {};
  const tags = Array.isArray(meta.tags) ? meta.tags.slice(0, 6) : undefined;
  const fit = typeof meta.fit === 'string' ? meta.fit : undefined;
  const pattern = typeof meta.pattern === 'string' ? meta.pattern : undefined;

  const parts = [
    `id=${i.id}`,
    i.category ? `cat=${i.category}` : null,
    i.title ? `title=${i.title}` : null,
    i.color ? `color=${i.color}` : null,
    i.season ? `season=${i.season}` : null,
    i.material ? `mat=${i.material}` : null,
    i.brand ? `brand=${i.brand}` : null,
    fit ? `fit=${fit}` : null,
    pattern ? `pattern=${pattern}` : null,
    tags && tags.length ? `tags=${tags.join(',')}` : null,
  ].filter(Boolean);

  return parts.join(';');
}

function buildStylistPrompt(profile, items, userPrompt, options = {}) {
  const focusIds = Array.isArray(options.focusClothIds)
    ? [...new Set(options.focusClothIds.map(Number).filter(Number.isFinite))]
    : [];
  const weather = options.weather && typeof options.weather === 'object' ? options.weather : null;

  const p = profile && typeof profile.toJSON === 'function' ? profile.toJSON() : (profile ?? {});
  const prefs = p && typeof p.prefs === 'object' && p.prefs ? p.prefs : {};
  const dislikes = p && typeof p.dislikes === 'object' && p.dislikes ? p.dislikes : {};

  const compactItems = (items ?? []).map((it) => {
    const plain = it && typeof it.toJSON === 'function' ? it.toJSON() : it;
    return compactItem(plain);
  });

  const focusLines =
    focusIds.length > 0
      ? (() => {
          const byId = new Map(
            (items ?? []).map((it) => {
              const plain = it && typeof it.toJSON === 'function' ? it.toJSON() : it;
              return [Number(plain.id), plain];
            }),
          );
          const lines = focusIds.map((id) => {
            const row = byId.get(id);
            return row ? compactItem(row) : `id=${id}`;
          });
          return ['', '## Anchored items (must appear in this outfit)', lines.join('\n')];
        })()
      : [];

  const userLine = (userPrompt && String(userPrompt).trim())
    ? `User request: ${String(userPrompt).trim()}`
    : 'User request: (none)';

  return [
    'You are a professional stylist. Create one cohesive outfit (look) from the given wardrobe items.',
    '',
    '## User profile',
    `skin_tone=${p.skin_tone ?? ''}; contrast=${p.contrast ?? ''}; height=${p.height ?? ''}; proportion=${p.proportion ?? ''}`,
    `wishes=${p.wishes ?? ''}`,
    `prefs=${safeJson(prefs)}`,
    `dislikes=${safeJson(dislikes)}`,
    `additions=${p.additions ?? ''}`,
    ...(weather
      ? [
          '',
          '## Weather context (current)',
          `location=${weather.location ?? ''}`,
          `temperature_c=${weather.temperature ?? ''}`,
          `feels_like_c=${weather.feels_like ?? ''}`,
          `description=${weather.description ?? ''}`,
          `wind_speed_kmh=${weather.wind_speed ?? ''}`,
          `humidity_percent=${weather.humidity ?? ''}`,
        ]
      : []),
    '',
    '## Styling rules',
    '- Use ONLY provided items. Do not invent items.',
    '- Prefer items with processing_status=completed (already filtered).',
    '- Keep the look realistic: compatible seasons, colors, and materials.',
    ...(weather
      ? [
          '- Consider Weather context: pick suitable layers/materials/outerwear/shoes for the temperature, wind and precipitation risk implied by the description.',
        ]
      : []),
    '- Aim for a complete outfit: base + top + outerwear (if relevant) + shoes (if available) + accessory (optional).',
    '- If wardrobe lacks something, still produce the best possible look from available items.',
    '- Roles must be short and clear (e.g., "top", "bottom", "outerwear", "shoes", "accessory").',
    ...(focusIds.length
      ? [
          '- The outfit MUST include every item listed under "Anchored items" (match by cloth_id).',
        ]
      : []),
    '',
    `## ${userLine}`,
    '',
    '## Wardrobe items (compact)',
    compactItems.length ? compactItems.join('\n') : '(empty)',
    ...focusLines,
    '',
    '## Output format',
    'Return ONLY a valid JSON object with this shape:',
    '{"look_name": string, "occasion": string, "items": [{"cloth_id": number, "role": string, "reason"?: string}]}',
    '',
    'CRITICAL: output MUST be ONLY valid JSON. No markdown, no backticks, no explanations.',
  ].join('\n');
}

module.exports = { buildStylistPrompt, compactItem };

