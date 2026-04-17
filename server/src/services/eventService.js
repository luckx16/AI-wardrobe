const { Event, Look } = require('../db/models');
const { Op } = require('sequelize');

class EventService {
  async findById(id, userId) {
    return await Event.findOne({
      where: { id, user_id: userId },
      include: [{ model: Look, as: 'look' }],
    });
  }

  async getAllEventsByUserId(userId, filters = {}) {
    const where = {
      user_id: userId,
      ...(filters.dateFrom && { [Op.gte]: filters.dateFrom }),
      ...(filters.dateTo && { [Op.gte]: filters.dateTo }),
    };

    return await Event.findAll({
      where,
      include: [{ model: Look, as: 'look' }],
      order: [['date', 'ASC']],
    });
  }

  async createEvent(userId, { activityType, ...data }) {
    return await Event.create({ user_id: userId, ...data });
  }

  async updateEvent(eventId, userId, data) {
    const event = await this.findById(eventId, userId);
    if (!event) {
      throw new Error('Event not found');
    }
    await event.update(data);
    return await this.findById(eventId, userId);
  }

  async delete(id, userId) {
    const event = await this.findById(id, userId);
    if (!event) {
      throw new Error('Event not found');
    }
    await event.destroy();
    return true;
  }
}

module.exports = new EventService();
