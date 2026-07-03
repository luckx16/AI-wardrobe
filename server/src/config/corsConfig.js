const corsConfig = {
  origin: true, // true автоматически возвращает origin запросившего (например, ваш мобильный IP)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  // origin: '*' || [
  //   'http://localhost:3000',
  //   'https://sc1qmtdw-3000.euw.devtunnels.ms',
  //   'https://ai-wardrobe.ru',
  //   'https://www.ai-wardrobe.ru',
  // ],
  // credentials: true,
};

module.exports = corsConfig;
