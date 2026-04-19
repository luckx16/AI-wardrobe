const router = require('express').Router();
const ClothController = require('../controllers/Cloth.controller');
const verifyAccessToken = require('../middleware/verifyAccessToken');
const upload = require('../middleware/upload');

router
  .route('/')
  .get(verifyAccessToken, ClothController.getAllClothes)
  .post(verifyAccessToken, upload.single('image'), ClothController.createCloth);

router
  .route('/:id')
  .get(verifyAccessToken, ClothController.getClothById)
  .put(verifyAccessToken, ClothController.updateCloth)
  .delete(verifyAccessToken, ClothController.deleteCloth);

// 🧠 Обработка изображений
// удалить фон для превью
router.route('/remove-background').post(upload.single('image'), ClothController.removeBackground);
// проверка статуса обработки
router.get('/:id/status', verifyAccessToken, ClothController.getProcessingStatus);

module.exports = router;
