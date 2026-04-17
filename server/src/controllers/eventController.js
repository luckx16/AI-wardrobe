const eventService = require('../services/eventService');
const formatResponse = require('../utils/formatResponse');

class EventController {
  async getAllEvents(req, res) {
    try {
      // const {user} = res.locals
      const userId = 1;
      const events = await eventService.getAllEventsByUserId(userId, req.query);
      res.status(200).json(formatResponse(200, 'События успешно получены', events));
    } catch (error) {
      res.status(500).json(formatResponse(500, 'Внутренняя ошибка сервера', null, error.message));
    }
  }

  async getEvent(req, res) {
    try {
      const event = await eventService.findById(req.params.id, req.user.id);
      if (!event) {
        return res.status(404).json(formatResponse(404, 'Событие не найдено', null));
      }
      res.status(200).json(formatResponse(200, 'Событие успешно получено', event));
    } catch (error) {
      res.status(500).json(formatResponse(500, 'Внутренняя ошибка сервера', null, error.message));
    }
  }

  async createEvent(req, res) {
    try {
      // const {user} = res.locals
      const userId = 1;
      const event = await eventService.createEvent(userId, req.body);
      res.status(201).json(formatResponse(201, 'Событие успешно создано', event));
    } catch (error) {
      res.status(400).json(formatResponse(400, 'Ошибка при создании события', null, error.message));
    }
  }

  async updateEvent(req, res) {
    try {
      // const {user} = res.locals
      const userId = 1;
      const event = await eventService.updateEvent(req.params.id, userId, req.body);
      res.status(200).json(formatResponse(200, 'Событие успешно обновлено', event));
    } catch (error) {
      res
        .status(400)
        .json(formatResponse(400, 'Ошибка при обновлении события', null, error.message));
    }
  }

  async deleteEvent(req, res) {
    try {
      // const {user} = res.locals
      const userId = 1;
      const isDeleted = await eventService.delete(req.params.id, userId);
      res.status(200).json(formatResponse(200, 'Событие успешно удалено', { isDeleted }, null));
    } catch (error) {
      res.status(400).json(formatResponse(400, 'Ошибка при удалении события', null, error.message));
    }
  }
}

module.exports = new EventController();
