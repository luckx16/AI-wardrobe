const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Создаем директорию для загрузок, если не существует
const uploadDir = path.join(__dirname, '../public/uploads/profile');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Генерация уникального имени файла
const generateFilename = (originalname) => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const ext = path.extname(originalname);
  return `${uniqueSuffix}${ext}`;
};

// Фильтр для проверки типа файла
const fileFilter = (req, file, cb) => {
  // Разрешаем только изображения
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Неверный формат файла. Разрешены только JPG, PNG, WEBP'));
  }
};

// Конфигурация хранилища
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, generateFilename(file.originalname));
  },
});

// Ограничения
const limits = {
  fileSize: 10 * 1024 * 1024, // 10MB
  files: 1,
};

// Экспортируем инстанс multer
const upload = multer({
  storage,
  fileFilter,
  limits,
});

// Middleware для обработки ошибок multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'Файл слишком большой. Максимальный размер: 10MB' 
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        error: 'Можно загрузить только один файл' 
      });
    }
    return res.status(400).json({ error: err.message });
  }
  
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  
  next();
};

module.exports = { upload, handleMulterError };