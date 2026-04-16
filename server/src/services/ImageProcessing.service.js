const fs = require('fs').promises;
const path = require('path');
const { Jimp } = require('jimp');
const { removeBackground } = require('@imgly/background-removal-node');

class ImageProcessingService {
  static async removeBackgroundAndOptimize(inputPath, outputPath) {
    try {
      console.log(`🖼️ Processing image: ${path.basename(inputPath)}`);

      // Определяем формат по расширению файла
      const ext = path.extname(inputPath).toLowerCase();
      const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
      console.log('Detected MIME type:', mimeType);

      // Используем file URL вместо буфера - это более надежный способ
      const fileUrl = `file://${inputPath}`;
      console.log('Using file URL:', fileUrl);

      // Удаляем фон
      const resultBlob = await removeBackground(fileUrl, {
        model: 'small',
        output: {
          format: 'image/png',
        },
      });

      console.log('Result blob type:', resultBlob?.type);

      // Конвертируем Blob в Buffer
      const resultBuffer = Buffer.from(await resultBlob.arrayBuffer());
      console.log('Result buffer size:', resultBuffer.length);

      // Оптимизируем через Jimp
      const image = await Jimp.read(resultBuffer);
      console.log('Image width:', image.width, 'height:', image.height);
      image.resize({ w: 800 });
      await image.write(outputPath);

      console.log(`✅ Image processed: ${path.basename(outputPath)}`);
      return outputPath;
    } catch (error) {
      console.error('Background removal failed:', error.message);
      console.log('Falling back to original image...');
      await fs.copyFile(inputPath, outputPath);
      return outputPath;
    }
  }

  static async extractImageMetadata(imagePath) {
    try {
      const image = await Jimp.read(imagePath);
      return {
        width: image.width,
        height: image.height,
        format: 'png',
        size: (await fs.stat(imagePath)).size,
      };
    } catch (error) {
      console.error('Metadata extraction failed:', error);
      return null;
    }
  }
}

module.exports = ImageProcessingService;
