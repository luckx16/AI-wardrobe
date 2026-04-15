const path = require('path');
const { Profile } = require('../models');
const { fileService } = require('../services/fileService');

class UploadController {
  // Загрузка портретного фото
  async uploadPortraitPhoto(req, res) {
    try {
      const userId = req.user?.id; // из middleware авторизации
      
      if (!req.file) {
        return res.status(400).json({ error: 'Файл не загружен' });
      }

      // Находим существующий профиль
      let profile = await Profile.findOne({ where: { user_id: userId } });

      // Если профиля нет, создаем новый
      if (!profile) {
        profile = await Profile.create({ user_id: userId });
      }

      // Сохраняем файл и получаем URL
      const uploadedFile = fileService.saveFile(req.file);

      // Удаляем старое фото если есть
      if (profile.portrait_photo) {
        const oldFilename = path.basename(profile.portrait_photo);
        fileService.deleteFile(oldFilename);
      }

      // Обновляем профиль
      await profile.update({
        portrait_photo: uploadedFile.url,
      });

      res.json({
        success: true,
        data: {
          url: uploadedFile.url,
          field: 'portrait_photo',
        },
      });
    } catch (error) {
      console.error('Upload portrait photo error:', error);
      res.status(500).json({ 
        error: 'Ошибка при загрузке фото',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Загрузка фото в полный рост
  async uploadBodyPhoto(req, res) {
    try {
      const userId = req.user?.id;
      
      if (!req.file) {
        return res.status(400).json({ error: 'Файл не загружен' });
      }

      let profile = await Profile.findOne({ where: { user_id: userId } });

      if (!profile) {
        profile = await Profile.create({ user_id: userId });
      }

      const uploadedFile = fileService.saveFile(req.file);

      // Удаляем старое фото
      if (profile.body_photo) {
        const oldFilename = path.basename(profile.body_photo);
        fileService.deleteFile(oldFilename);
      }

      await profile.update({
        body_photo: uploadedFile.url,
      });

      res.json({
        success: true,
        data: {
          url: uploadedFile.url,
          field: 'body_photo',
        },
      });
    } catch (error) {
      console.error('Upload body photo error:', error);
      res.status(500).json({ 
        error: 'Ошибка при загрузке фото',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Удаление фото
  async deletePhoto(req, res) {
    try {
      const userId = req.user?.id;
      const { field } = req.params; // 'portrait_photo' или 'body_photo'

      if (!['portrait_photo', 'body_photo'].includes(field)) {
        return res.status(400).json({ error: 'Неверное поле' });
      }

      const profile = await Profile.findOne({ where: { user_id: userId } });

      if (!profile) {
        return res.status(404).json({ error: 'Профиль не найден' });
      }

      const photoUrl = profile[field];
      
      if (photoUrl) {
        const filename = path.basename(photoUrl);
        fileService.deleteFile(filename);
      }

      await profile.update({
        [field]: null,
      });

      res.json({
        success: true,
        message: 'Фото удалено',
      });
    } catch (error) {
      console.error('Delete photo error:', error);
      res.status(500).json({ 
        error: 'Ошибка при удалении фото',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Загрузка нескольких фото (опционально)
  async uploadMultiplePhotos(req, res) {
    try {
      const userId = req.user?.id;
      
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'Файлы не загружены' });
      }

      const uploadedFiles = req.files.map(file => fileService.saveFile(file));

      res.json({
        success: true,
        data: {
          files: uploadedFiles,
          count: uploadedFiles.length,
        },
      });
    } catch (error) {
      console.error('Upload multiple photos error:', error);
      res.status(500).json({ 
        error: 'Ошибка при загрузке фото',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

module.exports = { uploadController: new UploadController() };