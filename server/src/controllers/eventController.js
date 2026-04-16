const eventService = require('../services/eventService');

class EventController {
  async getEvents(req, res) {
    try {
      const events = await eventService.findByUserId(req.user.id, req.query);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getEvent(req, res) {
    try {
      const event = await eventService.findById(req.params.id, req.user.id);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createEvent(req, res) {
    try {
      const event = await eventService.create(req.user.id, req.body);
      res.status(201).json(event);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateEvent(req, res) {
    try {
      const event = await eventService.update(req.params.id, req.user.id, req.body);
      res.json(event);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteEvent(req, res) {
    try {
      await eventService.delete(req.params.id, req.user.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new EventController();