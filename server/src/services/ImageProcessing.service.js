const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
// Это чисто JS библиотека для удаления фона (не требует Python!)
const { removeBackground } = require('@imgly/background-removal');

class ImageProcessingService {
  /**
   * Главный метод: удаляет фон и оптимизирует изображение
   * @param {string} inputPath - путь к временному файлу
   * @param {string} outputPath - куда сохранить результат
   * @returns {Promise<string>} - путь к обработанному файлу
   */
  static async removeBackgroundAndOptimize(inputPath, outputPath) {
    try {
      // 1. Читаем оригинальное изображение
      const imageBuffer = await fs.readFile(inputPath);

      // 2. Удаляем фон с помощью @imgly/background-removal
      const blob = await removeBackground(imageBuffer, {
        model: 'medium', // quality: 'small' | 'medium' | 'large' (чем выше, тем точнее)
        output: {
          format: 'image/png', // Сохраняем в PNG для прозрачности
        },
      });

      // Проверяем, что blob получен корректно
      if (!blob) {
        throw new Error('Background removal returned no blob');
      }

      // Конвертируем Blob в Buffer
      const arrayBuffer = await blob.arrayBuffer();
      const transparentImageBuffer = Buffer.from(arrayBuffer);

      // 3. Оптимизируем и изменяем размер через sharp
      const optimizedBuffer = await sharp(transparentImageBuffer)
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true }) // Максимум 800x800
        .png({ quality: 85, compressionLevel: 8 }) // Сжимаем PNG
        .toBuffer();

      // 4. Сохраняем обработанный файл
      await fs.writeFile(outputPath, optimizedBuffer);

      console.log('Image processed:', path.basename(outputPath));
      return outputPath;
    } catch (error) {
      console.error('Background removal failed:', error.message || error);
      // Если удаление фона не удалось, просто сохраняем оригинал
      console.log('Falling back to original image...');
      await fs.copyFile(inputPath, outputPath);
      return outputPath;
    }
  }

  /**
   * Извлекает базовые метаданные из изображения (опционально)
   * Можно расширить для определения цвета и т.д.
   */
  static async extractImageMetadata(imagePath) {
    try {
      const metadata = await sharp(imagePath).metadata();
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: metadata.size,
        // Здесь можно добавить анализ цвета через библиотеки типа 'color-thief-node'
      };
    } catch (error) {
      console.error('Metadata extraction failed:', error);
      return null;
    }
  }
}

module.exports = ImageProcessingService;
