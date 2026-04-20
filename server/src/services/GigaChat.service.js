const GigaChat = require('gigachat').default;
const https = require('node:https');

function normalizeEnv(value) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const hasSingleQuotes = trimmed.startsWith("'") && trimmed.endsWith("'");
  const hasDoubleQuotes = trimmed.startsWith('"') && trimmed.endsWith('"');
  return (hasSingleQuotes || hasDoubleQuotes) ? trimmed.slice(1, -1).trim() : trimmed;
}

function getGigaChatClient() {
  const credentials = normalizeEnv(process.env.GIGACHAT_CREDENTIALS);
  if (!credentials) return null;

  const model = normalizeEnv(process.env.GIGACHAT_MODEL) || 'GigaChat';
  const scope = normalizeEnv(process.env.GIGACHAT_SCOPE);
  const baseUrl =
    normalizeEnv(process.env.GIGACHAT_BASE_URL) || 'https://gigachat.devices.sberbank.ru/api/v1/';
  const timeoutRaw = normalizeEnv(process.env.GIGACHAT_TIMEOUT);
  const timeout = timeoutRaw ? Number(timeoutRaw) : undefined;

  // В dev-окружениях у GigaChat часто встречается корпоративная цепочка сертификатов.
  // Для учебного проекта включаем insecure по умолчанию, но в проде — только по явному флагу.
  const isProd = String(process.env.NODE_ENV || '').toLowerCase() === 'production';
  const insecureRaw = normalizeEnv(process.env.GIGACHAT_INSECURE);
  const insecure =
    typeof insecureRaw === 'string'
      ? insecureRaw.toLowerCase() === 'true'
      : !isProd;
  const httpsAgent = insecure ? new https.Agent({ rejectUnauthorized: false }) : undefined;
  if (insecure) {
    // Подстраховка для библиотек/транспорта, которые могут игнорировать кастомный agent.
    // Не используйте это в production.
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }

  return new GigaChat({
    credentials,
    model,
    scope,
    baseUrl,
    timeout,
    httpsAgent,
  });
}

module.exports = {
  getGigaChatClient,
};

