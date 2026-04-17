const { Profile } = require('../db/models');

class ProfileService {
  normalizeListField(value) {
    // В клиенте prefs/dislikes приходят как string[].
    // В БД сейчас JSONB с defaultValue: {} — удобнее хранить единым форматом { items: string[] }.
    if (value == null) return null;
    if (Array.isArray(value)) return { items: value.filter((x) => typeof x === 'string') };
    if (typeof value === 'object' && Array.isArray(value.items)) {
      return { items: value.items.filter((x) => typeof x === 'string') };
    }
    return { items: [] };
  }

  normalizePayload(data) {
    const next = { ...data };
    if ('prefs' in next) next.prefs = this.normalizeListField(next.prefs);
    if ('dislikes' in next) next.dislikes = this.normalizeListField(next.dislikes);
    return next;
  }

  async findByUserId(userId) {
    return await Profile.findOne({ where: { user_id: userId } });
  }

  async create(userId, data) {
    const existingProfile = await this.findByUserId(userId);
    if (existingProfile) {
      throw new Error('Profile already exists for this user');
    }
    const normalized = this.normalizePayload(data);
    return await Profile.create({ user_id: userId, ...normalized });
  }

  async update(userId, data) {
    const profile = await this.findByUserId(userId);
    if (!profile) {
      throw new Error('Profile not found');
    }
    const normalized = this.normalizePayload(data);
    await profile.update(normalized);
    return profile;
  }

  async upsert(userId, data) {
    const normalized = this.normalizePayload(data);
    const [profile, created] = await Profile.findOrCreate({
      where: { user_id: userId },
      defaults: { user_id: userId, ...normalized },
    });
    
    if (!created) {
      await profile.update(normalized);
    }
    
    return profile;
  }

  async delete(userId) {
    const profile = await this.findByUserId(userId);
    if (!profile) {
      throw new Error('Profile not found');
    }
    await profile.destroy();
    return true;
  }
}

module.exports = new ProfileService();