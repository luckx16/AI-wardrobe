const { Profile, User } = require('../db/models');

class ProfileService {
  serialize(profile) {
    if (!profile) return null;
    const plain = profile && typeof profile.toJSON === 'function' ? profile.toJSON() : profile;
    const user = plain?.user && typeof plain.user === 'object' ? plain.user : null;
    const safeUser = user
      ? {
          id: Number(user.id),
          name: typeof user.name === 'string' ? user.name : '',
          age: user.age == null ? null : Number(user.age),
        }
      : null;
    return {
      ...plain,
      user: safeUser,
    };
  }

  normalizeUserPayload(data) {
    const out = {};
    if (!data || typeof data !== 'object') return out;
    if ('name' in data) {
      const v = typeof data.name === 'string' ? data.name.trim() : '';
      if (!v) throw new Error('Name should not be empty');
      out.name = v;
    }
    if ('age' in data) {
      const raw = data.age;
      if (raw == null || raw === '') {
        out.age = null;
      } else {
        const n = Number(raw);
        if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0 || n > 120) {
          throw new Error('Age must be an integer between 0 and 120');
        }
        out.age = n;
      }
    }
    return out;
  }

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
    // user fields are stored in Users table, not profiles
    if ('name' in next) delete next.name;
    if ('age' in next) delete next.age;
    if ('prefs' in next) next.prefs = this.normalizeListField(next.prefs);
    if ('dislikes' in next) next.dislikes = this.normalizeListField(next.dislikes);
    return next;
  }

  async findByUserId(userId) {
    const profile = await Profile.findOne({
      where: { user_id: userId },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'age'] }],
    });
    return this.serialize(profile);
  }

  async create(userId, data) {
    const existing = await Profile.findOne({ where: { user_id: userId } });
    if (existing) {
      throw new Error('Profile already exists for this user');
    }
    const userPatch = this.normalizeUserPayload(data);
    const normalized = this.normalizePayload(data);
    if (Object.keys(userPatch).length) {
      await User.update(userPatch, { where: { id: userId } });
    }
    const created = await Profile.create({ user_id: userId, ...normalized });
    const withUser = await Profile.findOne({
      where: { id: created.id },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'age'] }],
    });
    return this.serialize(withUser);
  }

  async update(userId, data) {
    const profile = await Profile.findOne({ where: { user_id: userId } });
    if (!profile) {
      throw new Error('Profile not found');
    }
    const userPatch = this.normalizeUserPayload(data);
    const normalized = this.normalizePayload(data);
    if (Object.keys(userPatch).length) {
      await User.update(userPatch, { where: { id: userId } });
    }
    await profile.update(normalized);
    const withUser = await Profile.findOne({
      where: { id: profile.id },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'age'] }],
    });
    return this.serialize(withUser);
  }

  async upsert(userId, data) {
    const userPatch = this.normalizeUserPayload(data);
    const normalized = this.normalizePayload(data);
    const [profile, created] = await Profile.findOrCreate({
      where: { user_id: userId },
      defaults: { user_id: userId, ...normalized },
    });
    
    if (Object.keys(userPatch).length) {
      await User.update(userPatch, { where: { id: userId } });
    }
    if (!created) {
      await profile.update(normalized);
    }
    
    const withUser = await Profile.findOne({
      where: { id: profile.id },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'age'] }],
    });
    return this.serialize(withUser);
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