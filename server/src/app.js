const express = require('express');
const http = require('node:http');
const serverConfig = require('./config/serverConfig');
const mainRouter = require('./routes/main.routes');
const { setupChatWs } = require('./ws/chatWs');

const app = express();
const PORT = process.env.PORT ?? 4000;

// Запуск конфигурации сервера
serverConfig(app);

// Запуск маршрутизации
app.use('/', mainRouter);

const server = http.createServer(app);
setupChatWs(server);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT},\nURL: http://localhost:${PORT}`);
});