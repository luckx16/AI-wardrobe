const ClothService = require('../services/Cloth.service');
const ImageProcessingService = require('../services/ImageProcessing.service');
const fs = require('fs').promises;
const path = require('path');
const formatResponse = require('../utils/formatResponse');

class ClothController {
  static async getCloths(req, res) {
    try {
      const { user } = res.locals;
      const cloths = await ClothService.getAllByUserId(user.id);

      return res.json(formatResponse(200, 'Cloths retrieved', cloths));
    } catch (error) {
      console.error('Get cloths error:', error);
      return res.status(500).json(formatResponse(500, 'Internal server error', null, error.message));
    }
  }

  /**
   * POST /api/cloth
   * Создает новую вещь и запускает фоновую обработку изображения
   */
  static async createCloth(req, res) {
    try {
      const { user } = res.locals;

      // 2. Получаем текстовые поля из формы
      const { title, brand, material, color, category, season } = JSON.parse(req.body.data);

      // 3. Проверяем, что файл был загружен
      if (!req.file) {
        return res.status(400).json(formatResponse(400, 'Image is required', null, null));
      }

      // 4. Пути к файлам
      const tempImagePath = req.file.path; // uploads/temp/имя_файла
      const processedImageName = `processed-${Date.now()}-${req.file.filename}`;
      const processedImagePath = path.join(__dirname, '..', 'uploads', 'processed');

      // 5. Создаем запись в БД со статусом 'pending'
      const clothData = {
        title,
        user_id: user.id,
        brand: brand || null,
        material: material || null,
        color: color || null,
        category: category || null,
        season: season || null,
        image: processedImageName, // Временно сохраняем имя (файла еще нет)
        processing_status: 'pending', // Статус: ожидает обработки
        ai_metadata: {} // Пустой объект, заполнится позже
      };

      const newCloth = await ClothService.createNewCloth(clothData);

      // 6. ЗАПУСКАЕМ ФОНОВУЮ ОБРАБОТКУ (не ждем результата)
      // Это ключевой момент - ответ пользователю вернется сразу,
      // а обработка будет продолжаться в фоне
      ClothController.processImageAsync(newCloth.id, tempImagePath, processedImagePath);

      // 7. Возвращаем ответ пользователю (не дожидаясь обработки)
      return res.status(201).json(formatResponse(201, 'Cloth created, image processing started', {
        cloth: newCloth,
        processingStatus: 'pending',
        message: 'The image is being processed in the background. Check status endpoint for updates.'
      }));

    } catch (error) {
      console.error('Create cloth error:', error);

      // Если произошла ошибка - удаляем временный файл, если он был создан
      if (req.file) {
        await fs.unlink(req.file.path).catch(console.error);
      }

      return res.status(500).json(formatResponse(500, 'Internal server error', null, error.message));
    }
  }

  /**
   * АСИНХРОННАЯ обработка изображения (вызывается в фоне)
   * Этот метод не возвращает ответ пользователю, а молча обрабатывает
   */
  static async processImageAsync(clothId, tempPath, processedPath) {
    try {
      // 1. Обновляем статус на 'processing'
      await ClothService.updateClothStatus(clothId, 'processing');
      console.log(`🔄 Processing cloth ${clothId}...`);

      // 2. Удаляем фон и оптимизируем изображение
      const resultPath = await ImageProcessingService.removeBackgroundAndOptimize(tempPath, processedPath);

      // 3. (Опционально) Извлекаем метаданные из обработанного изображения
      const metadata = await ImageProcessingService.extractImageMetadata(resultPath);

      // 4. Обновляем запись в БД
      await ClothService.updateClothAfterProcessing(clothId, {
        image: path.basename(resultPath), // Обновляем путь к обработанному файлу
        processing_status: 'completed',   // Статус: готово
        ai_metadata: {
          processedAt: new Date().toISOString(),
          originalSize: metadata?.size || null,
          dimensions: metadata ? `${metadata.width}x${metadata.height}` : null
        }
      });

      // 5. Удаляем временный файл (он больше не нужен)
      await fs.unlink(tempPath).catch(console.error);

      console.log(`✅ Cloth ${clothId} processed successfully!`);

    } catch (error) {
      console.error(`❌ Processing failed for cloth ${clothId}:`, error);

      // Обновляем статус на 'failed'
      await ClothService.updateClothStatus(clothId, 'failed', error.message);

      // Удаляем временный файл, если он существует
      await fs.unlink(tempPath).catch(console.error);
    }
  }

  /**
   * GET /api/cloth/:id/status
   * Возвращает статус обработки для фронта
   */
  static async getProcessingStatus(req, res) {
    try {
      const { id } = req.params;
      const { user } = res.locals;
      const cloth = await ClothService.getClothById(id);

      if (!cloth) {
        return res.status(404).json(formatResponse(404, 'Cloth not found', null, null));
      }

      // Формируем URL для доступа к обработанному изображению
      const imageUrl = cloth.processing_status === 'completed' && cloth.image
        ? `/uploads/processed/${cloth.image}`
        : null;

      return res.json(formatResponse(200, 'Status retrieved', {
        id: cloth.id,
        processingStatus: cloth.processing_status,
        imageUrl: imageUrl,
        metadata: cloth.ai_metadata
      }));

    } catch (error) {
      return res
        .status(500)
        .json(formatResponse(500, 'Internal server error', null, error?.message ?? error));
    }
  }

  /**
   * POST /api/cloth/remove-background
   * Синхронно удаляет фон и возвращает URL обработанного изображения.
   * Используется фронтом для превью при добавлении вещи.
   */
  static async removeBackground(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json(formatResponse(400, 'Image is required', null, null));
      }

      const tempImagePath = req.file.path;
      const processedImageName = `processed-${Date.now()}-${req.file.filename}.png`;
      const processedImagePath = path.join(
        __dirname,
        '..',
        'uploads',
        'processed'
      );

      const resultPath = await ImageProcessingService.removeBackgroundAndOptimize(
        tempImagePath,
        processedImagePath,
      );

      await fs.unlink(tempImagePath).catch(console.error);

      return res.json(
        formatResponse(200, 'Background removed', {
          url: `/uploads/processed/${path.basename(resultPath)}`,
        }),
      );
    } catch (error) {
      console.error('Remove background error:', error);
      if (req.file) {
        await fs.unlink(req.file.path).catch(console.error);
      }
      return res.status(500).json(formatResponse(500, 'Internal server error', null, error.message));
    }
  }

  /**
 * GET /api/cloth
 */
  static async getAllClothes(req, res) {
    try {
      const { user } = res.locals;

      const clothes = await ClothService.getAllClothesByUser(user.id);

      return res.json(
        formatResponse(200, 'Clothes retrieved', clothes)
      );
    } catch (error) {
      console.error('Get all clothes error:', error);
      return res
        .status(500)
        .json(formatResponse(500, 'Internal server error', null, error.message));
    }
  }

  /**
   * GET /api/cloth/:id
   */
  static async getClothById(req, res) {
    try {
      const { id } = req.params;
      const { user } = res.locals;

      const cloth = await ClothService.getClothById(id, user.id);

      if (!cloth) {
        return res
          .status(404)
          .json(formatResponse(404, 'Cloth not found'));
      }

      return res.json(
        formatResponse(200, 'Cloth retrieved', cloth)
      );
    } catch (error) {
      console.error('Get cloth error:', error);
      return res
        .status(500)
        .json(formatResponse(500, 'Internal server error', null, error.message));
    }
  }

  /**
   * PUT /api/cloth/:id
   */
  static async updateCloth(req, res) {
    try {
      const { id } = req.params;
      const { user } = res.locals;

      const existing = await ClothService.getClothById(id);

      if (!existing || existing.user_id !== user.id) {
        return res.status(404).json(formatResponse(404, 'Cloth not found'));
      }

      const { title, brand, material, color, category, season } = req.body;

      const updated = await ClothService.updateCloth(id, {
        title,
        brand,
        material,
        color,
        category,
        season,
      });

      return res.json(
        formatResponse(200, 'Cloth updated', updated)
      );
    } catch (error) {
      console.error('Update cloth error:', error);
      return res
        .status(500)
        .json(formatResponse(500, 'Internal server error', null, error.message));
    }
  }

  /**
   * DELETE /api/cloth/:id
   */
  static async deleteCloth(req, res) {
    try {
      const { id } = req.params;
      const { user } = res.locals;

      const cloth = await ClothService.getClothById(Number(id), user.id);

      if (!cloth || cloth.user_id != user.id) {
        return res.status(404).json(formatResponse(404, 'Cloth not found'));
      }

      // удаляем файл изображения (если есть)
      if (cloth.image) {
        const filePath = path.join(
          __dirname,
          '..',
          'uploads',
          'processed',
          cloth.image
        );

        await fs.unlink(filePath).catch(() => { });
      }

      await ClothService.deleteCloth(id);

      return res.json(
        formatResponse(200, 'Cloth deleted')
      );
    } catch (error) {
      console.error('Delete cloth error:', error);
      return res
        .status(500)
        .json(formatResponse(500, 'Internal server error', null, error.message));
    }
  }


}

module.exports = ClothController;
