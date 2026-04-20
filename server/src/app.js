const express = require('express');
const http = require('node:http');
const serverConfig = require('./config/serverConfig');
const mainRouter = require('./routes/main.routes');
const { setupChatWs } = require('./ws/chatWs');

const app = express();
const BASE_PORT = Number(process.env.PORT ?? 4000);

// Запуск конфигурации сервера
serverConfig(app);

// Запуск маршрутизации
app.use('/', mainRouter);

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