const { getStyleRagStore } = require('./styleRagStore');

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function normalizeFilterValue(v) {
  if (v == null) return undefined;
  const s = String(v).trim();
  return s ? s : undefined;
}

function buildMetadataFilterFn(filters = {}) {
  const entries = Object.entries(filters)
    .map(([k, v]) => [String(k), normalizeFilterValue(v)])
    .filter(([, v]) => isNonEmptyString(v));

  if (!entries.length) return null;

  return (doc) => {
    const meta = doc?.metadata && typeof doc.metadata === 'object' ? doc.metadata : {};

    // Логика: если правило не задаёт поле — оно "универсальное" и проходит.
    // Если задаёт — должно совпасть с фильтром.
    for (const [key, want] of entries) {
      if (!(key in meta)) continue;
      const have = normalizeFilterValue(meta[key]);
      if (!have) continue;
      if (have !== want) return false;
    }
    return true;
  };
}

function getPriority(meta) {
  const p = meta && typeof meta === 'object' ? Number(meta.priority) : NaN;
  return Number.isFinite(p) ? p : 0;
}

let _BaseRetriever = null;

async function getBaseRetriever() {
  if (_BaseRetriever) return _BaseRetriever;
  const mod = await import('@langchain/core/retrievers');
  _BaseRetriever = mod.BaseRetriever;
  return _BaseRetriever;
}

async function createStyleRulesRetriever({ filters = {}, k = 4 } = {}) {
  const BaseRetriever = await getBaseRetriever();

  class StyleRulesRetriever extends BaseRetriever {
    constructor(fields) {
      super(fields);
      this.k = fields?.k ?? 4;
      this.filters = fields?.filters ?? {};
      this.scoreThreshold = Number.isFinite(fields?.scoreThreshold) ? fields.scoreThreshold : 0.7;
    }

    async _getRelevantDocuments(query) {
      const holder = await getStyleRagStore();
      await holder.reload();
      const store = holder.store;
      if (!store) return [];

      const filterFn = buildMetadataFilterFn(this.filters);
      const rows = await store.similaritySearchWithScore(
        String(query ?? ''),
        // Берём чуть больше, чтобы после отсечения по threshold всё равно получить до k.
        Math.max(this.k, 8),
        filterFn || undefined,
      );

      return rows
        .map(([doc, score]) => ({
          doc,
          score: Number(score) || 0,
          priority: getPriority(doc?.metadata),
        }))
        .filter((x) => x.score >= this.scoreThreshold)
        .sort((a, b) => (b.priority - a.priority) || (b.score - a.score))
        .slice(0, this.k)
        .map((x) => x.doc);
    }
  }

  return new StyleRulesRetriever({ filters, k, scoreThreshold: 0.7 });
}

module.exports = {
  createStyleRulesRetriever,
  buildMetadataFilterFn,
};

