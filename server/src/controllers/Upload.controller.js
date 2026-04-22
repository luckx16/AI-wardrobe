const path = require('path');
const { Profile } = require('../db/models');
const { fileService } = require('../services/File.service');
const ImageProcessingService = require('../services/ImageProcessing.service');
const formatResponse = require('../utils/formatResponse');

function getUserId(req, res) {
  const id = req.user?.id ?? res.locals.user?.id;
  return id ?? null;
}

function mergePrefs(profile, patch) {
  const base = profile?.prefs && typeof profile.prefs === 'object' ? profile.prefs : {};
  return { ...base, ...patch };
}

class UploadController {
  async uploadPortraitPhoto(req, res) {
    try {
      const userId = getUserId(req, res);
      if (!userId) {
        return res.status(403).json(formatResponse(403, 'Invalid access token', null, null));
      }

      if (!req.file) {
        return res.status(400).json(formatResponse(400, 'Файл не загружен', null, null));
      }

      let profile = await Profile.findOne({ where: { user_id: userId } });

      if (!profile) {
        profile = await Profile.create({ user_id: userId });
      }

      const uploadedFile = fileService.saveFile(req.file);

      const meta = await ImageProcessingService.extractImageMetadata(uploadedFile.path);

      // Удаляем оригинал после извлечения метаданных (храним только биометрию/атрибуты).
      fileService.deleteFile(uploadedFile.filename);

      await profile.update({
        portrait_photo: null,
        prefs: mergePrefs(profile, {
          portrait_image_metadata: meta,
          portrait_image_uploaded_at: new Date().toISOString(),
        }),
      });

      return res.json(
        formatResponse(200, 'Portrait uploaded', {
          metadata: meta,
          field: 'portrait_photo',
        }),
      );
    } catch (error) {
      console.error('Upload portrait photo error:', error);
      return res.status(500).json(
        formatResponse(500, 'Ошибка при загрузке фото', null, error instanceof Error ? error.message : 'Unknown error'),
      );
    }
  }

  async uploadBodyPhoto(req, res) {
    try {
      const userId = getUserId(req, res);
      if (!userId) {
        return res.status(403).json(formatResponse(403, 'Invalid access token', null, null));
      }

      if (!req.file) {
        return res.status(400).json(formatResponse(400, 'Файл не загружен', null, null));
      }

      let profile = await Profile.findOne({ where: { user_id: userId } });

      if (!profile) {
        profile = await Profile.create({ user_id: userId });
      }

      const uploadedFile = fileService.saveFile(req.file);

      const meta = await ImageProcessingService.extractImageMetadata(uploadedFile.path);

      // Удаляем оригинал после извлечения метаданных (храним только биометрию/атрибуты).
      fileService.deleteFile(uploadedFile.filename);

      await profile.update({
        body_photo: null,
        prefs: mergePrefs(profile, {
          body_image_metadata: meta,
          body_image_uploaded_at: new Date().toISOString(),
        }),
      });

      return res.json(
        formatResponse(200, 'Body photo uploaded', {
          metadata: meta,
          field: 'body_photo',
        }),
      );
    } catch (error) {
      console.error('Upload body photo error:', error);
      return res.status(500).json(
        formatResponse(500, 'Ошибка при загрузке фото', null, error instanceof Error ? error.message : 'Unknown error'),
      );
    }
  }

  async deletePhoto(req, res) {
    try {
      const userId = getUserId(req, res);
      if (!userId) {
        return res.status(403).json(formatResponse(403, 'Invalid access token', null, null));
      }
      const { field } = req.params;

      if (!['portrait_photo', 'body_photo'].includes(field)) {
        return res.status(400).json(formatResponse(400, 'Неверное поле', null, null));
      }

      const profile = await Profile.findOne({ where: { user_id: userId } });

      if (!profile) {
        return res.status(404).json(formatResponse(404, 'Профиль не найден', null, null));
      }

      const photoUrl = profile[field];

      if (photoUrl) {
        const filename = path.basename(photoUrl);
        fileService.deleteFile(filename);
      }

      await profile.update({
        [field]: null,
      });

      return res.json(formatResponse(200, 'Фото удалено', { deleted: true, field }));
    } catch (error) {
      console.error('Delete photo error:', error);
      return res.status(500).json(
        formatResponse(500, 'Ошибка при удалении фото', null, error instanceof Error ? error.message : 'Unknown error'),
      );
    }
  }

  async uploadMultiplePhotos(req, res) {
    try {
      const userId = getUserId(req, res);
      if (!userId) {
        return res.status(403).json(formatResponse(403, 'Invalid access token', null, null));
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json(formatResponse(400, 'Файлы не загружены', null, null));
      }

      const uploadedFiles = req.files.map((file) => fileService.saveFile(file));

      return res.json(
        formatResponse(200, 'Files uploaded', {
          files: uploadedFiles,
          count: uploadedFiles.length,
        }),
      );
    } catch (error) {
      console.error('Upload multiple photos error:', error);
      return res.status(500).json(
        formatResponse(500, 'Ошибка при загрузке фото', null, error instanceof Error ? error.message : 'Unknown error'),
      );
    }
  }
}

module.exports = { uploadController: new UploadController() };
