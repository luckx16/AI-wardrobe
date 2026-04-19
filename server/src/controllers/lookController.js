const lookService = require('../services/lookService');
const formatResponse = require('../utils/formatResponse');

class LookController {
  async getAllLooks(req, res) {
    try {
      const { user } = res.locals;
      const looks = await lookService.getAllLooksByUserId(user.id);
      res.status(200).json(formatResponse(200, 'Луки успешно получены', looks));
    } catch (error) {
      res.status(500).json(formatResponse(500, 'Внутренняя ошибка сервера', null, error.message));
    }
  }

  async getLook(req, res) {
    try {
      const { user } = res.locals;
      const look = await lookService.findById(req.params.id, user.id);
      if (!look) {
        return res.status(404).json(formatResponse(404, 'Лук не найден', null));
      }
      res.status(200).json(formatResponse(200, 'Лук успешно получен', look));
    } catch (error) {
      res.status(500).json(formatResponse(500, 'Внутренняя ошибка сервера', null, error.message));
    }
  }

  async createLook(req, res) {
    try {
      const { user } = res.locals;
      const look = await lookService.create(user.id, req.body);
      res.status(201).json(formatResponse(201, 'Лук успешно создан', look));
    } catch (error) {
      res.status(400).json(formatResponse(400, 'Ошибка при создании лука', null, error.message));
    }
  }

  async updateLook(req, res) {
    try {
      const { user } = res.locals;
      const look = await lookService.update(req.params.id, user.id, req.body);
      res.status(200).json(formatResponse(200, 'Лук успешно обновлён', look));
    } catch (error) {
      res.status(400).json(formatResponse(400, 'Ошибка при обновлении лука', null, error.message));
    }
  }

  async deleteLook(req, res) {
    try {
      const { user } = res.locals;
      await lookService.delete(req.params.id, user.id);
      res.status(200).json(formatResponse(200, 'Лук успешно удалён', { isDeleted: true }, null));
    } catch (error) {
      res.status(400).json(formatResponse(400, 'Ошибка при удалении лука', null, error.message));
    }
  }

  async addClothToLook(req, res) {
    try {
      const { user } = res.locals;
      const { cloth_id } = req.body;
      const look = await lookService.addCloth(req.params.id, user.id, cloth_id);
      res.status(200).json(formatResponse(200, 'Вещь успешно добавлена в лук', look));
    } catch (error) {
      res
        .status(400)
        .json(formatResponse(400, 'Ошибка при добавлении вещи в лук', null, error.message));
    }
  }

  async removeClothFromLook(req, res) {
    try {
      const { user } = res.locals;
      const look = await lookService.removeCloth(req.params.id, user.id, req.params.clothId);
      res.status(200).json(formatResponse(200, 'Вещь успешно удалена из лука', look));
    } catch (error) {
      res
        .status(400)
        .json(formatResponse(400, 'Ошибка при удалении вещи из лука', null, error.message));
    }
  }
}

module.exports = new LookController();
