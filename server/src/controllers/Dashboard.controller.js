const ClothService = require('../services/Cloth.service');
const LookService = require('../services/Look.service');
const formatResponse = require('../utils/formatResponse');

const SECTION_META = {
  headwear: { name: 'Головные уборы', emoji: '🧢' },
  top: { name: 'Верх', emoji: '👕' },
  accessory: { name: 'Аксессуары', emoji: '🎒' },
  bags: { name: 'Сумки', emoji: '👜' },
  bottom: { name: 'Низ', emoji: '👖' },
  shoes: { name: 'Обувь', emoji: '👟' },
  other: { name: 'Другое', emoji: '🧩' },
};

class DashboardController {
  static async getDashboardNumbers(req, res) {
    try {
      const { user } = res.locals;

      const [clothesNumber, looksNumber, wornStats] = await Promise.all([
        ClothService.clothesNumber(user.id),
        LookService.looksNumber(user.id),
        ClothService.wornStats(user.id),
      ]);

      return res.json(
        formatResponse(200, 'Dashboard stats loaded', {
          clothesNumber,
          looksNumber,
          wornLast30Days: wornStats.wornLast30Days,
          notWornMoreThan30Days: wornStats.notWornMoreThan30Days,
        }),
      );
    } catch (error) {
      console.error('Dashboard numbers error:', error);
      return res
        .status(500)
        .json(formatResponse(500, 'Internal server error', null, error.message));
    }
  }

  static async getDashboardCategory(req, res) {
    try {
      const { user } = res.locals;

      const rows = await ClothService.getSectionsStat(user.id);
      const total = rows.reduce((sum, row) => sum + Number(row.count || 0), 0);
      const sections = rows
        .map((row) => {
          const meta = SECTION_META[row.section] ?? {
            name: row.section,
            emoji: '📦',
          };

          const count = Number(row.count || 0);

          return {
            name: meta.name,
            emoji: meta.emoji,
            count,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0,
          };
        })
        .sort((a, b) => b.count - a.count);

      return res.json(
        formatResponse(200, 'Section count', sections),
      );
    } catch (error) {
      console.error('Dashboard category error:', error);
      return res
        .status(500)
        .json(formatResponse(500, 'Internal server error', null, error.message));
    }
  }

}

module.exports = DashboardController;
