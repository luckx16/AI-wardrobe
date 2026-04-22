function resolveClientKey(req) {
  const userId = req.user?.id ?? req?.res?.locals?.user?.id;
  if (userId != null) return `user:${userId}`;
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  return `ip:${String(ip).split(',')[0].trim()}`;
}

function createRateLimit({ windowMs = 60_000, max = 10 } = {}) {
  const hits = new Map(); // key -> { count, resetAtMs }

  return (req, res, next) => {
    const key = resolveClientKey(req);
    const now = Date.now();
    const row = hits.get(key);

    if (!row || now >= row.resetAtMs) {
      hits.set(key, { count: 1, resetAtMs: now + windowMs });
      return next();
    }

    row.count += 1;
    if (row.count <= max) {
      hits.set(key, row);
      return next();
    }

    const retryAfterSec = Math.max(1, Math.ceil((row.resetAtMs - now) / 1000));
    res.setHeader('Retry-After', String(retryAfterSec));
    return res.status(429).json({
      error: 'Too many requests',
      hint: `Try again in ${retryAfterSec}s`,
    });
  };
}

module.exports = {
  createRateLimit,
};

