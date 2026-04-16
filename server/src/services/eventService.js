const { Event, Look } = require('../db/models');
const { Op } = require('sequelize');

class EventService {
  async findById(id, userId) {
    return await Event.findOne({
      where: { id, user_id: userId },
      include: [{ model: Look, as: 'look' }],
    });
  }

  async findByUserId(userId, filters = {}) {
    const where = { user_id: userId };
    
    if (filters.dateFrom) {
      where.date = { [Op.gte]: filters.dateFrom };
    }
    if (filters.dateTo) {
      where.date = { ...where.date, [Op.lte]: filters.dateTo };
    }

    return await Event.findAll({
      where,
      include: [{ model: Look, as: 'look' }],
      order: [['date', 'ASC']],
    });
  }

  async create(userId, data) {
    return await Event.create({ user_id: userId, ...data });
  }

  async update(id, userId, data) {
    const event = await this.findById(id, userId);
    if (!event) {
      throw new Error('Event not found');
    }
    await event.update(data);
    return await this.findById(id, userId);
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