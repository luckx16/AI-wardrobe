const fs = require('node:fs/promises');
const path = require('node:path');

function asPlainObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
}

async function loadStylingRulesAsDocuments(filePath) {
  const absPath = path.resolve(String(filePath));
  const raw = await fs.readFile(absPath, 'utf-8');

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    const err = new Error(`Failed to parse styling rules JSON at ${absPath}: ${e?.message || e}`);
    err.cause = e;
    throw err;
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`Invalid styling rules format at ${absPath}: expected JSON array`);
  }

  const { Document } = await import('@langchain/core/documents');

  return parsed
    .map((row, idx) => {
      const r = asPlainObject(row);
      const content = typeof r.content === 'string' ? r.content.trim() : '';
      if (!content) return null;

      const metadata = asPlainObject(r.metadata);
      return new Document({
        pageContent: content,
        metadata: { ...metadata, _source: 'styling-rules.json', _index: idx },
      });
    })
    .filter(Boolean);
}

module.exports = {
  loadStylingRulesAsDocuments,
};

