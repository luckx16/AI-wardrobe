const fs = require('node:fs/promises');
const path = require('node:path');

const { loadStylingRulesAsDocuments } = require('./stylingRulesLoader');
const { GigaChatEmbeddings } = require('./GigaChatEmbeddings');

function resolveRulesPath() {
  const fromEnv = process.env.STYLING_RULES_PATH && String(process.env.STYLING_RULES_PATH).trim();
  if (fromEnv) return path.resolve(fromEnv);
  return path.resolve(process.cwd(), 'data', 'styling-rules.json');
}

async function statMtimeMs(filePath) {
  const st = await fs.stat(filePath);
  return Number(st.mtimeMs) || 0;
}

async function buildStoreFromFile(filePath) {
  const { MemoryVectorStore } = await import('@langchain/classic/vectorstores/memory');

  const docs = await loadStylingRulesAsDocuments(filePath);
  const embeddings = new GigaChatEmbeddings({ model: 'GigaChat', dimension: 1024 });
  const store = await MemoryVectorStore.fromDocuments(docs, embeddings);
  return { store, docsCount: docs.length };
}

async function getStyleRagStore() {
  if (!globalThis.__styleRagStore) {
    globalThis.__styleRagStore = {
      filePath: resolveRulesPath(),
      mtimeMs: 0,
      store: null,
      docsCount: 0,
      initPromise: null,
      async reload() {
        const mtimeMs = await statMtimeMs(this.filePath);
        if (this.store && this.mtimeMs && mtimeMs <= this.mtimeMs) {
          return { reloaded: false, docsCount: this.docsCount };
        }
        const built = await buildStoreFromFile(this.filePath);
        this.store = built.store;
        this.docsCount = built.docsCount;
        this.mtimeMs = mtimeMs;
        return { reloaded: true, docsCount: this.docsCount };
      },
    };
  }

  const holder = globalThis.__styleRagStore;
  if (!holder.store) {
    if (!holder.initPromise) {
      holder.initPromise = holder.reload().finally(() => {
        holder.initPromise = null;
      });
    }
    await holder.initPromise;
  }

  return holder;
}

module.exports = {
  getStyleRagStore,
  resolveRulesPath,
};

