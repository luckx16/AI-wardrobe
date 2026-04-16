const router = require('express').Router();
const AuthController = require('../controllers/Auth.controller');

// Маршрутизация по префиксам
router.route('/signUp')
    .post(AuthController.signUp)

router.route('/signIn')
    .post(AuthController.signIn)

router.route('/signOut')
    .delete(AuthController.signOut)

module.exports = router;