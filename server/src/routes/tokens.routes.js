const router = require('express').Router();
const verifyRefreshToken = require('../middleware/verifyRefreshToken');
const AuthController = require('../controllers/Auth.controller');

router.get('/refresh', verifyRefreshToken, AuthController.refreshTokens);

module.exports = router;