const router = require('express').Router();
const usersRoutes = require('./users.routes');
const authRoutes = require('./auth.routes');
const tokensRoutes = require('./tokens.routes');
const profileRoutes = require('./profile.routes');
const uploadRoutes = require('./upload.routes');
const chatsRoutes = require('./chats.routes');
const lookRoutes = require('./look.routes');
const eventRoutes = require('./event.routes');
const clothRoutes = require('./cloth.routes');
const weatherRoutes = require('./weather.routes');


router.use('/users', usersRoutes);
router.use('/auth', authRoutes);
router.use('/tokens', tokensRoutes);
router.use('/profile', profileRoutes);
router.use('/upload', uploadRoutes);
router.use('/chats', chatsRoutes);
router.use('/looks', lookRoutes);
router.use('/events', eventRoutes);
router.use('/cloth', clothRoutes);
router.use('/weather', weatherRoutes);

module.exports = router;
