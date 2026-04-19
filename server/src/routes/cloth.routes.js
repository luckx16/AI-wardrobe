const router = require('express').Router();
const ClothController = require('../controllers/Cloth.controller');
const verifyAccessToken = require('../middleware/verifyAccessToken');
const upload = require('../middleware/upload');

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
