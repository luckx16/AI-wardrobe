const router = require('express').Router();
const usersRoutes = require('./users.routes');
const authRoutes = require('./auth.routes');
const tokensRoutes = require('./tokens.routes');
const profileRoutes = require('./profile.routes');
const uploadRoutes = require('./upload.routes');

router.use('/users', usersRoutes);
router.use('/auth', authRoutes);
router.use('/tokens', tokensRoutes);
router.use('/profile', profileRoutes);
router.use('/upload', uploadRoutes);

module.exports = router;
