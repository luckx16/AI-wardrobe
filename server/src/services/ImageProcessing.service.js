const fs = require('fs').promises;
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { Jimp } = require('jimp');
const { removeBackground } = require('@imgly/background-removal-node');
const sharp = require('sharp');

const execFileAsync = promisify(execFile);

class ImageProcessingService {
  // Конвертирует любой формат в JPEG и физически применяет EXIF-ориентацию.
  // Нужно для всех форматов: iPhone пишет EXIF-ориентацию в любой фото (JPEG, HEIC и т.д.)
  static async prepareForProcessing(inputPath) {
    const tempPath = `${inputPath}_prepared.jpg`;

    try {
      // .rotate() без аргументов читает EXIF и физически поворачивает пиксели
      await sharp(inputPath).rotate().jpeg({ quality: 90 }).toFile(tempPath);
    } catch (err) {
      // macOS: старый libheif ограничивает 16 ссылками в iref-блоке (iPhone Live Photos имеют 48+).
      // sips использует нативный Apple-декодер без этого ограничения.
      if (process.platform === 'darwin' && err.message.includes('Security limit exceeded')) {
        console.log('Using sips fallback for HEIC conversion (macOS)...');
        await execFileAsync('sips', [
          '-s', 'format', 'jpeg',
          '-s', 'formatOptions', '90',
          inputPath,
          '--out', tempPath,
        ]);
        // sips сохраняет EXIF-ориентацию в метаданных — sharp применяет её к пикселям
        const buf = await sharp(tempPath).rotate().jpeg({ quality: 90 }).toBuffer();
        await fs.writeFile(tempPath, buf);
      } else {
        throw err;
      }
    }

    return tempPath;
  }

  static async removeBackgroundAndOptimize(inputPath, outputDir) {
    let preparedPath = null;

    try {
      console.log(`🖼️ Processing image: ${path.basename(inputPath)}`);

      preparedPath = await this.prepareForProcessing(inputPath);

      const fileUrl = `file://${preparedPath}`;
      console.log('Using file URL:', fileUrl);

      const resultBlob = await removeBackground(fileUrl, {
        model: 'small',
        output: { format: 'image/png' },
      });

      console.log('Result blob type:', resultBlob?.type);

      const resultBuffer = Buffer.from(await resultBlob.arrayBuffer());
      console.log('Result buffer size:', resultBuffer.length);

      const image = await Jimp.read(resultBuffer);
      console.log('Image width:', image.width, 'height:', image.height);
      image.resize({ w: 1000 });

      const baseName = path.basename(inputPath, path.extname(inputPath)) + '.png';
      const outputPath = path.join(outputDir, baseName);
      await image.write(outputPath);

      console.log(`✅ Image processed: ${path.basename(outputDir)}`);
      return outputPath;
    } catch (error) {
      console.error('Background removal failed:', error.message);
      console.log('Falling back to original image...');

      const fallbackSrc = preparedPath || inputPath;
      const fallbackExt = preparedPath ? '.jpg' : path.extname(inputPath);
      const baseName = path.basename(inputPath, path.extname(inputPath)) + fallbackExt;
      const outputPath = path.join(outputDir, baseName);
      await fs.copyFile(fallbackSrc, outputPath);
      return outputPath;
    } finally {
      if (preparedPath) {
        await fs.unlink(preparedPath).catch(() => {});
      }
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
