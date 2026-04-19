const { Cloth } = require('../db/models'); // Ваша модель Sequelize

class ClothService {
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
          failedAt: new Date().toISOString(),
        };
      }

      const [updatedRows] = await Cloth.update(updateData, {
        where: { id: clothId },
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
        where: { id: clothId },
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

  static async getClothById(clothId, userId = null) {
    try {
      const where = userId ? { id: clothId, user_id: userId } : { id: clothId };

      const cloth = await Cloth.findOne({ where });

      return cloth ? cloth.toJSON() : null;
    } catch (err) {
      console.error('Get cloth error:', err.message);
      throw err;
    }
  }

  /**
   * Получает все вещи пользователя
   */
  static async getAllClothesByUser(userId) {
    try {
      const clothes = await Cloth.findAll({
        where: { user_id: userId },
        order: [['createdAt', 'DESC']], // новые сверху
      });

      return clothes.map((c) => c.toJSON());
    } catch (err) {
      console.error('Get all clothes error:', err.message);
      throw err;
    }
  }

  /**
   * Обновляет данные вещи
   */
  static async updateCloth(clothId, data) {
    try {
      // убираем undefined поля (очень важно)
      const filteredData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined),
      );

      const [updatedRows] = await Cloth.update(filteredData, {
        where: { id: clothId },
      });

      if (updatedRows === 0) {
        throw new Error('Cloth not found');
      }

      const updatedCloth = await Cloth.findByPk(clothId);
      return updatedCloth.toJSON();
    } catch (err) {
      console.error('Update cloth error:', err.message);
      throw err;
    }
  }

  /**
   * Удаляет вещь
   */
  static async deleteCloth(clothId) {
    try {
      const deletedRows = await Cloth.destroy({
        where: { id: clothId },
      });

      if (deletedRows === 0) {
        throw new Error('Cloth not found');
      }

      return true;
    } catch (err) {
      console.error('Delete cloth error:', err.message);
      throw err;
    }
  }
}

module.exports = ClothService;
