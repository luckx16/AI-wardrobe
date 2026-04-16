const router = require('express').Router();
const usersRoutes = require('./users.routes');
const authRoutes = require('./auth.routes');
const tokensRoutes = require('./tokens.routes');
const profileRoutes = require('./profile.routes');
const uploadRoutes = require('./upload.routes');
<<<<<<< ai_GIGA
const chatsRoutes = require('./chats.routes');
=======
const lookRoutes = require('./look.routes');
const eventRoutes = require('./event.routes');
>>>>>>> dev

router.use('/users', usersRoutes);
router.use('/auth', authRoutes);
router.use('/tokens', tokensRoutes);
router.use('/profile', profileRoutes);
router.use('/upload', uploadRoutes);
<<<<<<< ai_GIGA
router.use('/chats', chatsRoutes);
=======
router.use('/looks', lookRoutes);
router.use('/events', eventRoutes);
>>>>>>> dev

module.exports = router;
