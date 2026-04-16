const router = require('express').Router();
const UserController = require('../controllers/User.controller')
const verifyAccessToken = require('../middleware/verifyAccessToken');

// CRUD

// Обычный маршрут
router.route('/')
    // .post() // Create
    .get(verifyAccessToken, UserController.getAllUsers) // Read

// Параметризированный маршрут
router.route('/:id')
    // .put() // Update
    .delete(verifyAccessToken, UserController.deleteUser) // Delete

module.exports = router;