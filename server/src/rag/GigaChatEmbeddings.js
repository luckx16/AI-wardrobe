const crypto = require('node:crypto');
const https = require('node:https');

function normalizeEnv(value) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const hasSingleQuotes = trimmed.startsWith("'") && trimmed.endsWith("'");
  const hasDoubleQuotes = trimmed.startsWith('"') && trimmed.endsWith('"');
  return hasSingleQuotes || hasDoubleQuotes ? trimmed.slice(1, -1).trim() : trimmed;
}

function ensureInsecureTlsIfConfigured() {
  const isProd = String(process.env.NODE_ENV || '').toLowerCase() === 'production';
  const insecureRaw = normalizeEnv(process.env.GIGACHAT_INSECURE);
  const insecure = typeof insecureRaw === 'string' ? insecureRaw.toLowerCase() === 'true' : !isProd;
  if (insecure) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    return new https.Agent({ rejectUnauthorized: false });
  }
  return null;
}

function resolveGigachatApiBaseUrl() {
  const fromEnv = normalizeEnv(process.env.GIGACHAT_BASE_URL);
  // В проекте уже используется baseUrl вида https://gigachat.devices.sberbank.ru/api/v1/
  return fromEnv || 'https://gigachat.devices.sberbank.ru/api/v1/';
}

function resolveOauthUrl() {
  return normalizeEnv(process.env.GIGACHAT_OAUTH_URL) || 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';
}

function resolveScope() {
  return normalizeEnv(process.env.GIGACHAT_SCOPE) || 'GIGACHAT_API_PERS';
}

async function getAccessTokenCached({ credentials, scope, httpsAgent }) {
  if (!globalThis.__gigachatOAuthToken) {
    globalThis.__gigachatOAuthToken = { token: null, expiresAtMs: 0 };
  }
  const cache = globalThis.__gigachatOAuthToken;

  const now = Date.now();
  if (cache.token && cache.expiresAtMs && now < cache.expiresAtMs - 30_000) {
    return cache.token;
  }

  const rqUid = crypto.randomUUID();
  const body = new URLSearchParams({ scope: scope || resolveScope() }).toString();

  const res = await fetch(resolveOauthUrl(), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
      RqUID: rqUid,
    },
    body,
    agent: httpsAgent || undefined,
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`GigaChat OAuth HTTP ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = JSON.parse(text);
  const token = typeof data?.access_token === 'string' ? data.access_token : null;
  const expiresAt = Number(data?.expires_at);
  if (!token || !Number.isFinite(expiresAt)) {
    throw new Error('GigaChat OAuth: unexpected token response shape');
  }

  cache.token = token;
  cache.expiresAtMs = expiresAt * 1000;
  return token;
}

class GigaChatEmbeddings {
  constructor(options = {}) {
    this.model = options.model || 'GigaChat';
    this.dimensions = Number.isFinite(options.dimension) ? options.dimension : 1024;
    this.credentials = normalizeEnv(options.credentials) || normalizeEnv(process.env.GIGACHAT_CREDENTIALS) || '';
    this.scope = normalizeEnv(options.scope) || normalizeEnv(process.env.GIGACHAT_SCOPE) || resolveScope();
    this.baseUrl = normalizeEnv(options.baseUrl) || resolveGigachatApiBaseUrl();
    this.timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : 20_000;
    this.httpsAgent = ensureInsecureTlsIfConfigured();
  }

  async embedQuery(text) {
    const [v] = await this.embedDocuments([text]);
    return v;
  }

  async embedDocuments(texts) {
    if (!this.credentials) {
      throw new Error('GigaChat embeddings: missing GIGACHAT_CREDENTIALS');
    }

    const inputs = Array.isArray(texts) ? texts.map((t) => String(t ?? '')) : [];
    const token = await getAccessTokenCached({
      credentials: this.credentials,
      scope: this.scope,
      httpsAgent: this.httpsAgent,
    });

    const url = new URL('embeddings', this.baseUrl).toString();
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(new Error('GigaChat embeddings timeout')), this.timeoutMs);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ model: this.model, input: inputs }),
        signal: controller.signal,
        agent: this.httpsAgent || undefined,
      });

      const text = await res.text();
      if (!res.ok) {
        throw new Error(`GigaChat embeddings HTTP ${res.status}: ${text.slice(0, 300)}`);
      }

      const data = JSON.parse(text);
      const arr = Array.isArray(data?.data) ? data.data : [];
      const byIndex = new Map(
        arr
          .map((row) => ({
            index: Number(row?.index),
            embedding: Array.isArray(row?.embedding) ? row.embedding : null,
          }))
          .filter((x) => Number.isFinite(x.index) && Array.isArray(x.embedding)),
      );

      return inputs.map((_, i) => byIndex.get(i)?.embedding ?? []);
    } finally {
      clearTimeout(t);
    }
  }
}

module.exports = {
  GigaChatEmbeddings,
};

