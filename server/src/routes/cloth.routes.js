const router = require('express').Router();
const ClothController = require('../controllers/Cloth.controller');
const verifyAccessToken = require('../middleware/verifyAccessToken');
const upload = require('../middleware/upload');

// POST /api/cloth - создание вещи с изображением
// upload.single('image') обрабатывает файл из поля 'image' и сохраняет в temp/
router
  .route('/')
  .get(verifyAccessToken, ClothController.getClothes)
  .post(verifyAccessToken, upload.single('image'), ClothController.createCloth);

// POST /api/cloth/remove-background - удалить фон для превью
router.route('/remove-background').post(upload.single('image'), ClothController.removeBackground);

// GET /api/cloth/:id/status - проверка статуса обработки
router.route('/:id/status').get(verifyAccessToken, ClothController.getProcessingStatus);
// 📦 CRUD
router.get('/', verifyAccessToken, ClothController.getAllClothes);
router.get('/:id', verifyAccessToken, ClothController.getClothById);
router.post('/', verifyAccessToken, upload.single('image'), ClothController.createCloth);
router.put('/:id', verifyAccessToken, ClothController.updateCloth);
router.delete('/:id', verifyAccessToken, ClothController.deleteCloth);

// 🧠 Обработка изображений
router.post('/remove-background', upload.single('image'), ClothController.removeBackground);
router.get('/:id/status', verifyAccessToken, ClothController.getProcessingStatus);

module.exports = router;
