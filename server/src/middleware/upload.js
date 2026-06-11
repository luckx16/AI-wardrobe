const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Создаем папки для файлов (если их нет)
const tempDir = path.join(__dirname, '..', 'public', 'uploads', 'temp');
const processedDir = path.join(__dirname, '..', 'public', 'uploads', 'processed');

// fs.mkdirSync создает папку, { recursive: true } - создает все вложенные папки
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}
if (!fs.existsSync(processedDir)) {
  fs.mkdirSync(processedDir, { recursive: true });
}

// Настройка WHERE и КАК сохранять временные файлы
const storage = multer.diskStorage({
  // destination - куда сохранять
  destination: (req, file, cb) => {
    cb(null, tempDir); // Все загруженные файлы сначала идут в temp/
  },
  // filename - как называть файл
  filename: (req, file, cb) => {
    // Создаем уникальное имя: timestamp-случайное_число.расширение
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Фильтр: разрешаем только изображения
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
    'image/heic', 'image/heif',
    'image/tiff', 'image/bmp',
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only images are allowed (JPEG, PNG, WebP, HEIC, HEIF, TIFF, BMP)'), false);
  }
};

// Экспортируем настроенный multer
// upload.single('image') - ожидает один файл с полем 'image' в форме
const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB лимит
});

module.exports = upload;