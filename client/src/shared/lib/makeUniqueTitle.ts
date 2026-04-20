export function makeUniqueTitle(baseRaw: string, usedTitles: Iterable<string>) {
  const base = baseRaw.replace(/\s+/g, ' ').trim();
  const fallback = 'Образ';
  const normalizedBase = base || fallback;

  const used = new Set(
    Array.from(usedTitles)
      .map((t) => t.replace(/\s+/g, ' ').trim())
      .filter(Boolean),
  );

  if (!used.has(normalizedBase)) return normalizedBase;

  let i = 2;
  while (used.has(`${normalizedBase} (${i})`)) i += 1;
  return `${normalizedBase} (${i})`;
}

