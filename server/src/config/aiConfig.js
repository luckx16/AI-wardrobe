const { setTimeout: delay } = require('node:timers/promises');


//   Для Gemini structured outputs используем официальный Gemini API endpoint.
// - Для GPT-4o-mini фоллбэка используем GenAPI proxy endpoint.
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
// GenAPI OpenAI-compatible proxy (returns JSON like OpenAI chat completions)
const OPENAI_API_URL = 'https://proxy.gen-api.ru/v1/chat/completions';

function requireEnv(name) {
  const v = process.env[name];
  if (!v || !String(v).trim()) {
    throw new Error(`Missing env var: ${name}`);
  }
  return String(v).trim();
}

function withTimeout(ms) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(new Error('AI request timeout')), ms);
  return { controller, clear: () => clearTimeout(t) };
}

async function fetchJson(url, { method = 'POST', headers = {}, body, timeoutMs = 15000, retries = 0 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const { controller, clear } = withTimeout(timeoutMs);
    try {
      const res = await fetch(url, {
        method,
        headers: {
          'content-type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      const text = await res.text();
      if (!res.ok) {
        throw new Error(`AI HTTP ${res.status}: ${text.slice(0, 300)}`);
      }

      try {
        return JSON.parse(text);
      } catch {
        // Некоторые провайдеры возвращают JSON как вложенную строку — прокидываем как есть.
        return { raw: text };
      }
    } catch (e) {
      lastErr = e;
      if (attempt < retries) {
        await delay(150 * (attempt + 1));
        continue;
      }
      throw lastErr;
    } finally {
      clear();
    }
  }
  throw lastErr;
}

async function fetchJsonWithRaw(url, opts) {
  const { method = 'POST', headers = {}, body, timeoutMs = 15000 } = opts ?? {};
  const { controller, clear } = withTimeout(timeoutMs);
  try {
    const res = await fetch(url, {
      method,
      headers: {
        'content-type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const rawText = await res.text();
    if (!res.ok) {
      throw new Error(`AI HTTP ${res.status}: ${rawText.slice(0, 300)}`);
    }
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = { raw: rawText };
    }
    return { parsed, rawText };
  } finally {
    clear();
  }
}

function extractJsonTextFromGeminiResponse(data) {
  // Типичный ответ Gemini: { candidates: [{ content: { parts: [{ text: "..." }] } }] }
  const t =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ??
    data?.output_text ??
    data?.text ??
    data?.raw;
  return typeof t === 'string' ? t : null;
}

function extractJsonTextFromOpenAiResponse(data) {
  // Типичный ответ OpenAI: { choices: [{ message: { content: "..." } }] }
  const t =
    data?.choices?.[0]?.message?.content ??
    data?.choices?.[0]?.text ??
    data?.data?.choices?.[0]?.message?.content ??
    data?.result?.choices?.[0]?.message?.content ??
    data?.response?.choices?.[0]?.message?.content ??
    data?.output_text ??
    data?.raw;
  return typeof t === 'string' ? t : null;
}

function extractFirstJsonObject(text) {
  const s = String(text);
  const start = s.indexOf('{');
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < s.length; i += 1) {
    const ch = s[i];

    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === '\\') {
        escape = true;
        continue;
      }
      if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === '{') depth += 1;
    if (ch === '}') depth -= 1;

    if (depth === 0) {
      return s.slice(start, i + 1);
    }
  }

  return null;
}

function parsePossiblyWrappedJson(text) {
  if (!text) return null;
  const trimmed = String(text).trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // На случай "```json ...```", префиксов/суффиксов или нескольких JSON подряд —
    // вырезаем ПЕРВЫЙ валидно сбалансированный JSON-объект.
    const slice = extractFirstJsonObject(trimmed);
    if (slice) return JSON.parse(slice);
    throw new Error('Failed to parse JSON from AI response');
  }
}

const geminiClient = {
  async generateJson({ prompt, responseSchema, timeoutMs = 15000, generationConfig } = {}) {
    const key = requireEnv('GEMINI_API_KEY');

    // Gemini REST API: ключ можно передавать как query (?key=) или заголовком x-goog-api-key.
    const data = await fetchJson(`${GEMINI_API_URL}?key=${encodeURIComponent(key)}`, {
      timeoutMs,
      body: {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema,
          ...(generationConfig && typeof generationConfig === 'object' ? generationConfig : {}),
        },
      },
    });

    const text = extractJsonTextFromGeminiResponse(data);
    if (!text) {
      const keys = data && typeof data === 'object' ? Object.keys(data).slice(0, 25) : [];
      throw new Error(`Gemini returned unexpected shape (no candidates text). keys=${keys.join(',')}`);
    }
    return parsePossiblyWrappedJson(text);
  },
};

const openaiClient = {
  async generateJson({ prompt, timeoutMs = 15000, temperature } = {}) {
    const key = requireEnv('OPENAI_API_KEY');

    const { parsed: data, rawText } = await fetchJsonWithRaw(OPENAI_API_URL, {
      timeoutMs,
      headers: { Authorization: `Bearer ${key}` },
      body: {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You output only valid JSON.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        ...(Number.isFinite(temperature) ? { temperature } : {}),
      },
    });

    const text = extractJsonTextFromOpenAiResponse(data);
    if (!text) {
      const keys = data && typeof data === 'object' ? Object.keys(data).slice(0, 25) : [];
      throw new Error(
        `GenAPI returned unexpected shape (no choices.message.content). keys=${keys.join(',')} raw=${String(rawText).slice(0, 160)}`,
      );
    }
    const obj = parsePossiblyWrappedJson(text);
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      const keys = Object.keys(obj);
      if (keys.length === 1 && keys[0] === 'imports') {
        throw new Error(`GenAPI returned non-model payload: {"imports":...}. raw=${String(rawText).slice(0, 200)}`);
      }
    }
    return obj;
  },
};

module.exports = {
  geminiClient,
  openaiClient,
};

