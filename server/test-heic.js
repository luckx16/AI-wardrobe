/**
 * Быстрый тест конвертации HEIC и удаления фона.
 * Запуск: node test-heic.js /путь/к/файлу.heic
 */
const path = require('path');
const ImageProcessingService = require('./src/services/ImageProcessing.service');

const inputPath = process.argv[2];

if (!inputPath) {
  console.error('Использование: node test-heic.js /путь/к/файлу.heic');
  process.exit(1);
}

const outputDir = path.join(__dirname, 'src/public/uploads/processed');

console.log('Входной файл:', inputPath);
console.log('Выходная папка:', outputDir);
console.log('---');

ImageProcessingService.removeBackgroundAndOptimize(inputPath, outputDir)
  .then((resultPath) => {
    console.log('---');
    console.log('✅ Успешно! Результат:', resultPath);
  })
  .catch((err) => {
    console.error('❌ Ошибка:', err.message);
  });
