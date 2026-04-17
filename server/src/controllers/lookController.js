const lookService = require('../services/lookService');
const lookGenerateService = require('../services/lookGenerateService');

class LookController {
  /**
   * POST /api/looks/generate — AI-генерация лука (логика в сервисе lookGenerateService).
   */
  async generateLook(req, res) {
    const { userId, userPrompt } = req.body ?? {};
    const user_id =
      Number.isFinite(Number(userId)) && Number(userId) > 0
        ? Number(userId)
        : Number(req.user?.id);
    if (!Number.isFinite(user_id) || user_id <= 0) {
      return res.status(400).json({
        error: 'Invalid userId',
        hint: 'Send JSON body { "userId": <number>, "userPrompt": <string> } or authenticate with Bearer token.',
      });
    }

    if (req.user?.id && Number(req.user.id) !== user_id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const isDev = String(process.env.NODE_ENV || '').toLowerCase() !== 'production';

    try {
      const result = await lookGenerateService.generateLook({ user_id, userPrompt });
      return res.json(result.response);
    } catch (err) {
      if (err.status && err.body) {
        return res.status(err.status).json(err.body);
      }
      if (err.name === 'ZodError') {
        return res.status(422).json({
          error: lookGenerateService.formatZodError(err),
          stage: err.stage,
          ...(isDev && err.lastAiJson ? { ai_preview: lookGenerateService.buildAiPreview(err.lastAiJson) } : {}),
        });
      }
      console.error(err);
      return res.status(500).json({
        error: 'Failed to generate look',
        ...(isDev ? { detail: err?.message ?? String(err) } : {}),
      });
    }
  }

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