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

// async function getProcessedFiles() {
//   const processedDir = path.join(__dirname, '../public/uploads/processed');
//   const files = await fs.readdir(processedDir);
//   console.log('files', files);
//   files.forEach((fileName) => {
//     ImageProcessingService.removeBackgroundAndOptimize(
//       `/Users/4tune/Desktop/Elbrus/phase3/FinalProject/server/src/public/uploads/processed/${fileName}`,
//       `/Users/4tune/Desktop/Elbrus/phase3/FinalProject/server/src/public/uploads/processed/2${fileName}`,
//     );
//   });
//   // return files.filter((f) => !f.startsWith('.'));
// }
// async function renameProcessedFiles() {
//   const processedDir = path.join(__dirname, '../public/uploads/processed');
//   const files = await fs.readdir(processedDir);
//   for (const fileName of files) {
//     if (fileName.startsWith('2')) {
//       const oldPath = path.join(processedDir, fileName);
//       const newPath = path.join(processedDir, fileName.slice(1));
//       await fs.rename(oldPath, newPath);
//       console.log(`Renamed: ${fileName} → ${fileName.slice(1)}`);
//     }
//   }
// }

module.exports = ImageProcessingService;
