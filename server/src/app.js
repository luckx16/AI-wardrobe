const express = require('express');
const http = require('node:http');
const serverConfig = require('./config/serverConfig');
const mainRouter = require('./routes/main.routes');
const { setupChatWs } = require('./ws/chatWs');
const { getStyleRagStore } = require('./rag/styleRagStore');

const app = express();
const BASE_PORT = Number(process.env.PORT ?? 4000);

function ensureNoProxyForGigachat() {
  const hasProxy = Boolean(process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy);
  if (!hasProxy) return;

  const hosts = ['ngw.devices.sberbank.ru', 'gigachat.devices.sberbank.ru'];
  const cur = String(process.env.NO_PROXY || process.env.no_proxy || '');
  const parts = cur
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const set = new Set(parts);
  for (const h of hosts) set.add(h);

  const next = Array.from(set).join(',');
  process.env.NO_PROXY = next;
  process.env.no_proxy = next;
}

ensureNoProxyForGigachat();

// Запуск конфигурации сервера
serverConfig(app);

// Запуск маршрутизации
app.use('/', mainRouter);

// Прогреваем RAG-индекс правил на старте (best-effort, без падения сервера).
getStyleRagStore()
  .then((h) => h.reload())
  .then((r) => console.log(`[style-rag] ready: docs=${r.docsCount}`))
  .catch((e) => console.warn('[style-rag] warmup failed:', e?.message || e));

function listenWithFallback(port, attemptsLeft = 10) {
  const server = http.createServer(app);
  const wss = setupChatWs(server);

  let handled = false;
  const onError = (err) => {
    if (handled) return;
    if (err && err.code === 'EADDRINUSE' && attemptsLeft > 0) {
      handled = true;
      try {
        wss.close();
      } catch {
        // ignore
      }
      server.close(() => listenWithFallback(port + 1, attemptsLeft - 1));
      return;
    }
    throw err;
  };

  // Важно: в Express + ws ошибка может прилетать и на HTTP server, и на WebSocketServer.
  server.once('error', onError);
  wss.once('error', onError);

  server.listen(port, () => {
    console.log(`Server is running on port ${port},\nURL: http://localhost:${port}`);
  });
}

listenWithFallback(BASE_PORT);