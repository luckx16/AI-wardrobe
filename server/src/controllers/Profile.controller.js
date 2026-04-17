const profileService = require('../services/Profile.service');
const formatResponse = require('../utils/formatResponse');

function getUserId(req, res) {
  const id = req.user?.id ?? res.locals.user?.id;
  return id ?? null;
}

class ProfileController {
  async getProfile(req, res) {
    try {
      const userId = getUserId(req, res);
      if (!userId) {
        return res.status(403).json(formatResponse(403, 'Invalid access token', null, null));
      }

      const profile = await profileService.findByUserId(userId);
      if (!profile) {
        return res.status(404).json(formatResponse(404, 'Profile not found', null, null));
      }
      return res.json(formatResponse(200, 'Profile loaded', profile));
    } catch (error) {
      return res
        .status(500)
        .json(formatResponse(500, error?.message ?? 'Server error', null, error?.message ?? error));
    }
  }

  async createProfile(req, res) {
    try {
      const userId = getUserId(req, res);
      if (!userId) {
        return res.status(403).json(formatResponse(403, 'Invalid access token', null, null));
      }

      const profile = await profileService.create(userId, req.body);
      return res.status(201).json(formatResponse(201, 'Profile created', profile));
    } catch (error) {
      return res.status(400).json(formatResponse(400, error?.message ?? 'Bad request', null, error?.message ?? error));
    }
  }

  async updateProfile(req, res) {
    try {
      const userId = getUserId(req, res);
      if (!userId) {
        return res.status(403).json(formatResponse(403, 'Invalid access token', null, null));
      }

      const profile = await profileService.update(userId, req.body);
      return res.json(formatResponse(200, 'Profile updated', profile));
    } catch (error) {
      return res.status(400).json(formatResponse(400, error?.message ?? 'Bad request', null, error?.message ?? error));
    }
  }

  async upsertProfile(req, res) {
    try {
      const userId = getUserId(req, res);
      if (!userId) {
        return res.status(403).json(formatResponse(403, 'Invalid access token', null, null));
      }

      const profile = await profileService.upsert(userId, req.body);
      return res.json(formatResponse(200, 'Profile saved', profile));
    } catch (error) {
      const err = error;
      const message = err instanceof Error ? err.message : 'Unknown error';
      const details =
        err && typeof err === 'object' && 'errors' in err ? err.errors : undefined;
      return res.status(400).json(formatResponse(400, message, details ? { details } : null, message));
    }
  }

  async deleteProfile(req, res) {
    try {
      const userId = getUserId(req, res);
      if (!userId) {
        return res.status(403).json(formatResponse(403, 'Invalid access token', null, null));
      }

      await profileService.delete(userId);
      return res.json(formatResponse(200, 'Profile deleted', { deleted: true }));
    } catch (error) {
      return res.status(400).json(formatResponse(400, error?.message ?? 'Bad request', null, error?.message ?? error));
    }
  }
}

module.exports = new ProfileController();
