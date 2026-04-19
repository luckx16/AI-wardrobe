const { Look, LookCloth, Cloth } = require('../db/models');

class LookService {
  async findById(id, userId) {
    return await Look.findOne({
      where: { id, user_id: userId },
      include: [{ model: Cloth, as: 'clothes', through: { attributes: [] } }],
    });
  }

  async getAllLooksByUserId(userId) {
    return await Look.findAll({
      where: { user_id: userId },
      include: [{ model: Cloth, as: 'clothes', through: { attributes: [] } }],
    });
  }

  async create(userId, data) {
    const look = await Look.create({ user_id: userId, ...data });

    if (data.cloth_ids && Array.isArray(data.cloth_ids)) {
      const lookCloths = data.cloth_ids.map((cloth_id) => ({
        look_id: look.id,
        cloth_id,
      }));
      await LookCloth.bulkCreate(lookCloths);
    }

    return this.findById(look.id, userId);
  }

  async update(id, userId, data) {
    const look = await this.findById(id, userId);
    if (!look) {
      throw new Error('Look not found');
    }

    await look.update({ title: data.title });

    if (data.cloth_ids !== undefined) {
      await LookCloth.destroy({ where: { look_id: id } });

      if (Array.isArray(data.cloth_ids) && data.cloth_ids.length > 0) {
        const lookCloths = data.cloth_ids.map((cloth_id) => ({
          look_id: id,
          cloth_id,
        }));
        await LookCloth.bulkCreate(lookCloths);
      }
    }

    return this.findById(id, userId);
  }

  async delete(id, userId) {
    const look = await this.findById(id, userId);
    if (!look) {
      throw new Error('Look not found');
    }
    await look.destroy();
    return true;
  }

  async addCloth(lookId, userId, clothId) {
    const look = await this.findById(lookId, userId);
    if (!look) {
      throw new Error('Look not found');
    }

    await LookCloth.findOrCreate({
      where: { look_id: lookId, cloth_id: clothId },
    });

    return this.findById(lookId, userId);
  }

  async removeCloth(lookId, userId, clothId) {
    const look = await this.findById(lookId, userId);
    if (!look) {
      throw new Error('Look not found');
    }

    await LookCloth.destroy({
      where: { look_id: lookId, cloth_id: clothId },
    });

    return this.findById(lookId, userId);
  }
}

module.exports = new LookService();
