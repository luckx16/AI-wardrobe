const router = require('express').Router();
const apiRouter = require('./api.routes');
const otherRouter = require('./other.routes');

// Маршрутизация по префиксам
router.use('/api', apiRouter)
router.use('/', otherRouter)

module.exports = router;