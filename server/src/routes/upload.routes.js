const router = require('express').Router();
const { upload, handleMulterError } = require('../config/multer.config');
const { uploadController } = require('../controllers/uploadController');
const verifyAccessToken = require('../middleware/verifyAccessToken')


router.use(verifyAccessToken);

// Загрузка портретного фото
router.post(
  '/portrait',
  upload.single('portrait_photo'),
  handleMulterError,
  (req, res) => uploadController.uploadPortraitPhoto(req, res)
);

// Загрузка фото в полный рост
router.post(
  '/body',
  upload.single('body_photo'),
  handleMulterError,
  (req, res) => uploadController.uploadBodyPhoto(req, res)
);

// Удаление фото
router.delete(
  '/:field',
  (req, res) => uploadController.deletePhoto(req, res)
);

module.exports = router;