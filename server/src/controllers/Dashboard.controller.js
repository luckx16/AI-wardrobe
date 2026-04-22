const ClothService = require('../services/Cloth.service');
const LookService = require('../services/Look.service');
const formatResponse = require('../utils/formatResponse');
const { Op } = require('sequelize'); // операторы SQL
const { Cloth, Look, LookCloth } = require('../db/models');

const SECTION_META = {
  headwear: { name: 'Головные уборы', emoji: '🧢' },
  top: { name: 'Верх', emoji: '👕' },
  accessory: { name: 'Аксессуары', emoji: '🎒' },
  bags: { name: 'Сумки', emoji: '👜' },
  bottom: { name: 'Низ', emoji: '👖' },
  shoes: { name: 'Обувь', emoji: '👟' },
  other: { name: 'Другое', emoji: '🧩' },
};

//возвращает дату "days дней назад"
function getCutoffDate(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

//считает процент изменения
function buildTrend(currentValue, previousValue, label = 'к предыдущим 30 дням') {
  if (previousValue === 0) {
    return { value: currentValue > 0 ? 100 : 0, label };
  }

  const delta = ((currentValue - previousValue) / previousValue) * 100;
  return {
    value: Math.round(delta),
    label,
  };
}

//считает сколько вещей создано в интервале
async function countClothesCreatedBetween(userId, from, to) {
  return Cloth.count({
    where: {
      user_id: userId,
      createdAt: {
        [Op.gte]: from,
        [Op.lt]: to,
      },
    },
  });
}

//считает сколько луков создано в интервале
async function countLooksCreatedBetween(userId, from, to) {
  return Look.count({
    where: {
      user_id: userId,
      createdAt: {
        [Op.gte]: from,
        [Op.lt]: to,
      },
    },
  });
}

//считает сколько раз одежда использовалась в луках
async function countWornUsesBetween(userId, from, to) {
  return LookCloth.count({
    include: [
      {
        model: Look,
        as: 'look',
        attributes: [],
        required: true,
        where: {
          user_id: userId,
          updatedAt: {
            [Op.gte]: from,
            [Op.lt]: to,
          },
        },
      },
    ],
  });
}

//считает давно не носили (никогда не носили)
async function countStaleClothes(userId, cutoffDate) {
  return Cloth.count({
    where: {
      user_id: userId,
      [Op.or]: [{ worn_at: { [Op.lt]: cutoffDate } }, { worn_at: null }],
    },
  });
}

class DashboardController {
  static async getDashboardNumbers(req, res) {
    try {
      const { user } = res.locals;

      const currentStart = getCutoffDate(30);
      const previousStart = getCutoffDate(60);
      const currentEnd = new Date();
      const previousEnd = currentStart;

      const [
        clothesNumber,
        looksNumber,
        wornStats,
        clothesCurrent30,
        clothesPrevious30,
        looksCurrent30,
        looksPrevious30,
        wornCurrent30,
        wornPrevious30,
        notWornCurrent30,
        notWornPrevious30,
      ] = await Promise.all([
        ClothService.clothesNumber(user.id),
        LookService.looksNumber(user.id),
        ClothService.wornStats(user.id),
        countClothesCreatedBetween(user.id, currentStart, currentEnd),
        countClothesCreatedBetween(user.id, previousStart, previousEnd),
        countLooksCreatedBetween(user.id, currentStart, currentEnd),
        countLooksCreatedBetween(user.id, previousStart, previousEnd),
        countWornUsesBetween(user.id, currentStart, currentEnd),
        countWornUsesBetween(user.id, previousStart, previousEnd),
        countStaleClothes(user.id, currentStart),
        countStaleClothes(user.id, previousStart),
      ]);

      return res.json(
        formatResponse(200, 'Dashboard stats loaded', {
          clothesNumber,
          looksNumber,
          wornLast30Days: wornStats.wornLast30Days,
          notWornMoreThan30Days: wornStats.notWornMoreThan30Days,
          clothesTrend: buildTrend(clothesCurrent30, clothesPrevious30),
          looksTrend: buildTrend(looksCurrent30, looksPrevious30),
          wornTrend: buildTrend(wornCurrent30, wornPrevious30),
          notWornTrend: buildTrend(notWornCurrent30, notWornPrevious30),
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
