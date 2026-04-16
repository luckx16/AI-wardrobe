const router = require('express').Router();
const ClothController = require('../controllers/Cloth.controller');
const verifyAccessToken = require('../middleware/verifyAccessToken')

router.route('/')
    .post(verifyAccessToken, ClothController.createCloth)

module.exports = router;