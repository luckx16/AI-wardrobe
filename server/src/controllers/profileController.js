const profileService = require('../services/profileService');

function getUserId(req, res) {
  const id = req.user?.id ?? res.locals.user?.id;
  return id ?? null;
}

class ProfileController {
  async getProfile(req, res) {
    try {
      const userId = getUserId(req, res);
      if (!userId) return res.status(403).json({ error: 'Invalid access token' });

      const profile = await profileService.findByUserId(userId);
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
      const userId = getUserId(req, res);
      if (!userId) return res.status(403).json({ error: 'Invalid access token' });

      const profile = await profileService.create(userId, req.body);
      res.status(201).json(profile);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateProfile(req, res) {
    try {
      const userId = getUserId(req, res);
      if (!userId) return res.status(403).json({ error: 'Invalid access token' });

      const profile = await profileService.update(userId, req.body);
      res.json(profile);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async upsertProfile(req, res) {
    try {
      const userId = getUserId(req, res);
      if (!userId) return res.status(403).json({ error: 'Invalid access token' });

      const profile = await profileService.upsert(userId, req.body);
      res.json(profile);
    } catch (error) {
      // Возвращаем чуть больше диагностической информации, чтобы быстрее понять причину 400.
      const err = error;
      const message = err instanceof Error ? err.message : 'Unknown error';
      const details =
        err && typeof err === 'object' && 'errors' in err
          ? err.errors
          : undefined;
      res.status(400).json({ error: message, details });
    }
  }

  async deleteProfile(req, res) {
    try {
      const userId = getUserId(req, res);
      if (!userId) return res.status(403).json({ error: 'Invalid access token' });

      await profileService.delete(userId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new ProfileController();