const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');
const { URL } = require('node:url');
const { generateAiReply, clearHistory } = require('../services/AiChat.service');

function safeSend(ws, payload) {
  try {
    ws.send(JSON.stringify(payload));
  } catch {
    // ignore
  }
}

function broadcast(clients, payload) {
  for (const c of clients.values()) {
    safeSend(c.ws, payload);
  }
}

function getActiveUsers(clients) {
  return Array.from(clients.values()).map((c) => ({ id: c.user.id, name: c.user.name }));
}

function getActiveUsersWithAi(clients) {
  const users = getActiveUsers(clients);
  if (clients.size === 1) {
    users.push({ id: 'ai', name: 'AI' });
  }
  return users;
}

function parseToken(req) {
  const u = new URL(req.url, 'http://localhost');
  return u.searchParams.get('token');
}

function verifyAccessToken(token) {
  const { user } = jwt.verify(token, process.env.JWT_ACCESS);
  return user;
}

function setupChatWs(httpServer) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/chat' });

  // ws -> { ws, user }
  const clients = new Map();

  function syncUsers() {
    broadcast(clients, { type: 'users', data: getActiveUsersWithAi(clients) });
  }

  wss.on('connection', (ws, req) => {
    let user;
    const prevSize = clients.size;
    try {
      const token = parseToken(req);
      if (!token) throw new Error('No token');
      user = verifyAccessToken(token);
      if (!user?.id) throw new Error('Invalid user');
    } catch {
      ws.close(1008, 'Unauthorized');
      return;
    }

    clients.set(ws, { ws, user });
    safeSend(ws, { type: 'system', data: { text: 'Connected' } });
    broadcast(clients, { type: 'system', data: { text: `${user.name} joined` } });

    // Если это первый и единственный пользователь — "подключаем" AI
    if (prevSize === 0) {
      safeSend(ws, { type: 'system', data: { text: 'AI is online (solo mode)' } });
    }
    // Если подключился второй реальный — AI "уходит" и больше не отвечает
    if (prevSize === 1) {
      broadcast(clients, { type: 'system', data: { text: 'AI is offline (multi-user mode)' } });
    }

    syncUsers();

    ws.on('message', async (data) => {
      let payload;
      try {
        payload = JSON.parse(String(data));
      } catch {
        return;
      }

      if (payload.type !== 'message') return;
      const text = String(payload.text ?? '').trim();
      if (!text) return;

      const from = clients.get(ws)?.user;
      if (!from) return;

      const msg = { from: from.id, fromName: from.name, text, ts: Date.now() };
      broadcast(clients, { type: 'message', data: msg });

      // AI mode: only one active user (this user)
      if (clients.size === 1) {
        try {
          const aiText = await generateAiReply({ userId: from.id, userName: from.name, text });
          const aiMsg = { from: 'ai', fromName: 'AI', text: aiText, ts: Date.now() };
          safeSend(ws, { type: 'message', data: aiMsg });
        } catch (e) {
          const errText = e?.message ? String(e.message) : 'AI error';
          safeSend(ws, { type: 'system', data: { text: `AI error: ${errText}` } });
        }
      }
    });

    ws.on('close', () => {
      const meta = clients.get(ws);
      const wasSize = clients.size;
      clients.delete(ws);
      if (meta?.user?.id) clearHistory(meta.user.id);
      broadcast(clients, { type: 'system', data: { text: `${user.name} left` } });

      // Если снова остался один реальный пользователь — возвращаем AI
      if (wasSize === 2 && clients.size === 1) {
        const remaining = Array.from(clients.values())[0];
        if (remaining?.ws) {
          safeSend(remaining.ws, { type: 'system', data: { text: 'AI is online (solo mode)' } });
        }
      }

      syncUsers();
    });
  });

  return wss;
}

module.exports = {
  setupChatWs,
};

