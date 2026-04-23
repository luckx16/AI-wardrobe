const path = require('path');
const fs = require('fs');

class FileService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../public/uploads/profile');
    this.baseUrl = process.env.UPLOADS_URL || '/uploads/profile';
    
    // Создаем директорию если не существует
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  // Сохранение файла
  saveFile(file) {
    const url = `${this.baseUrl}/${file.filename}`;
    
    return {
      filename: file.filename,
      path: file.path,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url,
    };
  }

  // Удаление файла
  deleteFile(filename) {
    const filePath = path.join(this.uploadDir, filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    
    return false;
  }

  // Обновление файла (удаляем старый, сохраняем новый)
  updateFile(oldFilename, newFile) {
    if (oldFilename) {
      this.deleteFile(oldFilename);
    }
    
    return this.saveFile(newFile);
  }

  // Получение URL по имени файла
  getFileUrl(filename) {
    return `${this.baseUrl}/${filename}`;
  }

  // Очистка старых файлов (опционально)
  cleanupOldFiles(maxAge = 24 * 60 * 60 * 1000) {
    const files = fs.readdirSync(this.uploadDir);
    const now = Date.now();

    files.forEach((file) => {
      const filePath = path.join(this.uploadDir, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtimeMs > maxAge) {
        fs.unlinkSync(filePath);
      }
    });
  }
}

module.exports = { fileService: new FileService() };