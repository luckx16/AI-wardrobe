const lookService = require('../services/lookService');

class LookController {
  async getLooks(req, res) {
    try {
      const looks = await lookService.findByUserId(req.user.id);
      res.json(looks);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getLook(req, res) {
    try {
      const look = await lookService.findById(req.params.id, req.user.id);
      if (!look) {
        return res.status(404).json({ error: 'Look not found' });
      }
      res.json(look);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createLook(req, res) {
    try {
      const look = await lookService.create(req.user.id, req.body);
      res.status(201).json(look);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateLook(req, res) {
    try {
      const look = await lookService.update(req.params.id, req.user.id, req.body);
      res.json(look);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteLook(req, res) {
    try {
      await lookService.delete(req.params.id, req.user.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async addClothToLook(req, res) {
    try {
      const { cloth_id } = req.body;
      const look = await lookService.addCloth(req.params.id, req.user.id, cloth_id);
      res.json(look);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async removeClothFromLook(req, res) {
    try {
      const look = await lookService.removeCloth(req.params.id, req.user.id, req.params.clothId);
      res.json(look);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new LookController();