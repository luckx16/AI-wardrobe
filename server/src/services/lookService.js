const { Look, LookCloth, Cloth } = require('../db/models');

function serializeLook(look, clothIds = []) {
  const raw = typeof look.toJSON === 'function' ? look.toJSON() : look;
  return {
    ...raw,
    id: raw.id?.toString?.() ?? String(raw.id),
    user_id: raw.user_id?.toString?.() ?? String(raw.user_id),
    cloth_ids: clothIds.map((id) => id?.toString?.() ?? String(id)),
  };
}

class LookService {
  async findById(id, userId) {
    const look = await Look.findOne({
      where: { id, user_id: userId },
      include: [{ model: Cloth, as: 'clothes', through: { attributes: [] }, attributes: ['id'] }],
    });
    if (!look) return null;
    return serializeLook(look, look.clothes?.map((cloth) => cloth.id) ?? []);
  }

  async findByUserId(userId) {
    const looks = await Look.findAll({
      where: { user_id: userId },
      include: [{ model: Cloth, as: 'clothes', through: { attributes: [] }, attributes: ['id'] }],
      order: [['createdAt', 'DESC']],
    });
    return looks.map((look) => serializeLook(look, look.clothes?.map((cloth) => cloth.id) ?? []));
  }

  async create(userId, data) {
    const look = await Look.create({ user_id: userId, ...data });
    
    if (data.cloth_ids && Array.isArray(data.cloth_ids)) {
      const lookCloths = data.cloth_ids.map(cloth_id => ({
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
        const lookCloths = data.cloth_ids.map(cloth_id => ({
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
