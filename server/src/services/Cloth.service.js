const { Cloth } = require('../db/models'); // Ваша модель Sequelize

class ClothService {
  static async getAllByUserId(userId) {
    try {
      const cloths = await Cloth.findAll({
        where: { user_id: userId },
        order: [['createdAt', 'DESC']],
      });
      return cloths.map((cloth) => cloth.toJSON());
    } catch (err) {
      console.error('Get cloths error:', err.message);
      throw err;
    }
  }

  
  /**
   * Создает новую запись в БД
   */
  static async createNewCloth(clothData) {
    try {
      const cloth = await Cloth.create(clothData);
      return cloth.toJSON(); // Возвращаем простой объект, а не инстанс Sequelize
    } catch (err) {
      console.error('Create cloth error:', err.message);
      throw err;
    }
  }
  
  /**
   * Обновляет статус обработки
   */
  static async updateClothStatus(clothId, status, errorMessage = null) {
    try {
      const updateData = { processing_status: status };
      
      // Если ошибка - сохраняем её в ai_metadata
      if (errorMessage && status === 'failed') {
        updateData.ai_metadata = { 
          error: errorMessage,
          failedAt: new Date().toISOString()
        };
      }
      
      const [updatedRows] = await Cloth.update(updateData, {
        where: { id: clothId }
      });
      
      return updatedRows > 0;
    } catch (err) {
      console.error('Update cloth status error:', err.message);
      throw err;
    }
  }
  
  /**
   * Обновляет запись после успешной обработки изображения
   */
  static async updateClothAfterProcessing(clothId, updateData) {
    try {
      const [updatedRows] = await Cloth.update(updateData, {
        where: { id: clothId }
      });
      
      if (updatedRows === 0) {
        throw new Error('Cloth not found');
      }
      
      // Возвращаем обновленную запись
      const updatedCloth = await Cloth.findByPk(clothId);
      return updatedCloth.toJSON();
    } catch (err) {
      console.error('Update cloth after processing error:', err.message);
      throw err;
    }
  }
  
  /**
   * Получает запись по ID
   */
  static async getClothById(clothId) {
    try {
      const cloth = await Cloth.findByPk(clothId);
      return cloth ? cloth.toJSON() : null;
    } catch (err) {
      console.error('Get cloth error:', err.message);
      throw err;
    }
  }
}

module.exports = ClothService;
