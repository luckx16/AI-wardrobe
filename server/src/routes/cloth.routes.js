const router = require('express').Router();
const ClothController = require('../controllers/Cloth.controller');
const verifyAccessToken = require('../middleware/verifyAccessToken');
const upload = require('../middleware/upload');

// POST /api/cloth - создание вещи с изображением
// upload.single('image') обрабатывает файл из поля 'image' и сохраняет в temp/
router.route('/')
  .post(upload.single('image'), ClothController.createCloth);
  // .post(verifyAccessToken, upload.single('image'), ClothController.createCloth);

// POST /api/cloth/remove-background - удалить фон для превью
router.route('/remove-background')
  .post(upload.single('image'), ClothController.removeBackground);

// GET /api/cloth/:id/status - проверка статуса обработки
router.route('/:id/status')
  .get(ClothController.getProcessingStatus);
  // .get(verifyAccessToken, ClothController.getProcessingStatus);

module.exports = router;