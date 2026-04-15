const { Profile } = require('../models');

class ProfileService {
  async findByUserId(userId) {
    return await Profile.findOne({ where: { user_id: userId } });
  }

  async create(userId, data) {
    const existingProfile = await this.findByUserId(userId);
    if (existingProfile) {
      throw new Error('Profile already exists for this user');
    }
    return await Profile.create({ user_id: userId, ...data });
  }

  async update(userId, data) {
    const profile = await this.findByUserId(userId);
    if (!profile) {
      throw new Error('Profile not found');
    }
    await profile.update(data);
    return profile;
  }

  async upsert(userId, data) {
    const [profile, created] = await Profile.findOrCreate({
      where: { user_id: userId },
      defaults: { user_id: userId, ...data },
    });
    
    if (!created) {
      await profile.update(data);
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