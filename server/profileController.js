const profileService = require('../services/profileService');

class ProfileController {
  async getProfile(req, res) {
    try {
      const profile = await profileService.findByUserId(req.user.id);
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createProfile(req, res) {
    try {
      const profile = await profileService.create(req.user.id, req.body);
      res.status(201).json(profile);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateProfile(req, res) {
    try {
      const profile = await profileService.update(req.user.id, req.body);
      res.json(profile);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async upsertProfile(req, res) {
    try {
      const profile = await profileService.upsert(req.user.id, req.body);
      res.json(profile);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteProfile(req, res) {
    try {
      await profileService.delete(req.user.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new ProfileController();