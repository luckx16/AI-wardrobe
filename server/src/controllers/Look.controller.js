const lookService = require('../services/Look.service');
const lookGenerateService = require('../services/LookGenerate.service');
const formatResponse = require('../utils/formatResponse');

class LookController {
  /**
   * POST /api/looks/generate — AI-генерация лука (логика в сервисе LookGenerate.service).
   */
  async generateLook(req, res) {
    const { userId, userPrompt } = req.body ?? {};
    const user_id =
      Number.isFinite(Number(userId)) && Number(userId) > 0 ? Number(userId) : Number(req.user?.id);
    if (!Number.isFinite(user_id) || user_id <= 0) {
      return res.status(400).json(
        formatResponse(400, 'Invalid userId', null, {
          hint: 'Send JSON body { "userId": <number>, "userPrompt": <string> } or authenticate with Bearer token.',
        }),
      );
    }

    if (req.user?.id && Number(req.user.id) !== user_id) {
      return res.status(403).json(formatResponse(403, 'Forbidden', null, null));
    }

    const isDev = String(process.env.NODE_ENV || '').toLowerCase() !== 'production';

    try {
      const result = await lookGenerateService.generateLook({ user_id, userPrompt });
      return res.json(formatResponse(200, 'Look generated', result.response));
    } catch (err) {
      if (err.status && err.body) {
        const msg = err.body?.error ?? err.body?.hint ?? 'Request failed';
        return res.status(err.status).json(formatResponse(err.status, msg, null, err.body));
      }
      if (err.name === 'ZodError') {
        return res.status(422).json(
          formatResponse(422, 'Validation failed', null, {
            error: lookGenerateService.formatZodError(err),
            stage: err.stage,
            ...(isDev && err.lastAiJson
              ? { ai_preview: lookGenerateService.buildAiPreview(err.lastAiJson) }
              : {}),
          }),
        );
      }
      console.error(err);
      return res
        .status(500)
        .json(
          formatResponse(
            500,
            'Failed to generate look',
            null,
            isDev ? (err?.message ?? String(err)) : null,
          ),
        );
    }
  }

  async getLooks(req, res) {
    try {
      const { user } = res.locals;
      const looks = await lookService.findByUserId(user.id);
      console.log('getLooks:');

      return res.json(formatResponse(200, 'Looks loaded', looks));
    } catch (error) {
      return res
        .status(500)
        .json(formatResponse(500, error?.message ?? 'Server error', null, error?.message ?? error));
    }
  }

  async getLook(req, res) {
    try {
      const look = await lookService.findById(req.params.id, req.user.id);
      if (!look) {
        return res.status(404).json(formatResponse(404, 'Look not found', null, null));
      }
      return res.json(formatResponse(200, 'Look loaded', look));
    } catch (error) {
      return res
        .status(500)
        .json(formatResponse(500, error?.message ?? 'Server error', null, error?.message ?? error));
    }
  }

  async createLook(req, res) {
    try {
      const look = await lookService.create(req.user.id, req.body);
      return res.status(201).json(formatResponse(201, 'Look created', look));
    } catch (error) {
      return res
        .status(400)
        .json(formatResponse(400, error?.message ?? 'Bad request', null, error?.message ?? error));
    }
  }

  async updateLook(req, res) {
    try {
      const look = await lookService.update(req.params.id, req.user.id, req.body);
      return res.json(formatResponse(200, 'Look updated', look));
    } catch (error) {
      return res
        .status(400)
        .json(formatResponse(400, error?.message ?? 'Bad request', null, error?.message ?? error));
    }
  }

  async toggleLike(req, res) {
    try {
      const { user } = res.locals;
      const look = await lookService.toggleLike(req.params.id, user.id);
      return res.json(formatResponse(200, 'Look like updated', look));
    } catch (error) {
      return res
        .status(400)
        .json(formatResponse(400, error?.message ?? 'Bad request', null, error?.message ?? error));
    }
  }

  async deleteLook(req, res) {
    try {
      const { user } = res.locals;
      await lookService.delete(req.params.id, user.id);
      return res.json(formatResponse(200, 'Look deleted', { deleted: true }));
    } catch (error) {
      return res
        .status(400)
        .json(formatResponse(400, error?.message ?? 'Bad request', null, error?.message ?? error));
    }
  }

  async addClothToLook(req, res) {
    try {
      const { cloth_id } = req.body;
      const look = await lookService.addCloth(req.params.id, req.user.id, cloth_id);
      return res.json(formatResponse(200, 'Cloth added to look', look));
    } catch (error) {
      return res
        .status(400)
        .json(formatResponse(400, error?.message ?? 'Bad request', null, error?.message ?? error));
    }
  }

  async removeClothFromLook(req, res) {
    try {
      const look = await lookService.removeCloth(req.params.id, req.user.id, req.params.clothId);
      return res.json(formatResponse(200, 'Cloth removed from look', look));
    } catch (error) {
      return res
        .status(400)
        .json(formatResponse(400, error?.message ?? 'Bad request', null, error?.message ?? error));
    }
  }
}

module.exports = new LookController();
