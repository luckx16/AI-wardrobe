const { Look, LookCloth, Cloth } = require('../db/models');

function normalizeClothIds(clothIds = []) {
  return [...new Set((clothIds || []).map((id) => Number(id)).filter((n) => Number.isFinite(n) && n > 0))];
}

function getDateOnly(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

async function updateWornAtForCloths(clothIds, wornAt = new Date()) {
  const normalizedIds = normalizeClothIds(clothIds);
  if (!normalizedIds.length) return;

  await Cloth.update(
    { worn_at: getDateOnly(wornAt) },
    {
      where: { id: normalizedIds },
    },
  );
}

const CHAT_CLOTH_ATTRIBUTES = [
  'id',
  'title',
  'brand',
  'material',
  'color',
  'category',
  'season',
  'image',
  'ai_metadata',
];

function pickClothForChat(c) {
  const raw = typeof c.toJSON === 'function' ? c.toJSON() : c;
  return {
    id: raw.id,
    title: raw.title,
    brand: raw.brand,
    material: raw.material,
    color: raw.color,
    category: raw.category,
    season: raw.season,
    image: raw.image,
    ai_metadata: raw.ai_metadata,
  };
}

function buildChatPayloadFromLookInstance(look) {
  const raw = typeof look.toJSON === 'function' ? look.toJSON() : look;
  const meta = raw.metadata && typeof raw.metadata === 'object' ? raw.metadata : {};
  const itemRoles = meta.item_roles && typeof meta.item_roles === 'object' ? meta.item_roles : {};

  const cloths = (raw.clothes || []).map((c) => {
    const plain = pickClothForChat(c);
    const id = Number(plain.id);
    const role = itemRoles[String(id)] ?? itemRoles[id] ?? 'item';
    return { ...plain, role };
  });

  return {
    look: {
      id: raw.id,
      user_id: raw.user_id,
      title: raw.title,
      metadata: raw.metadata ?? {},
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    },
    cloths,
  };
}

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
  async findById(id, userId, hasSerializing = true) {
    const look = await Look.findOne({
      where: { id, user_id: userId },
      include: [{ model: Cloth, as: 'clothes', through: { attributes: [] } }],
    });
    if (!look) return null;

    if (!hasSerializing) {
      return look;
    }
    return serializeLook(look, look.clothes?.map((cloth) => cloth.id) ?? []);
  }

  /**
   * Формат как у ответа генерации лука — для UI чата (LookCard), без дублирования в chat_messages.content.
   */
  async getLookChatPayload(lookId, userId) {
    const look = await Look.findOne({
      where: { id: lookId, user_id: userId },
      include: [
        {
          model: Cloth,
          as: 'clothes',
          through: { attributes: [] },
          attributes: CHAT_CLOTH_ATTRIBUTES,
        },
      ],
    });
    if (!look) return null;
    return buildChatPayloadFromLookInstance(look);
  }

  /**
   * Пакетная подгрузка луков для истории чата (один запрос на список id).
   * @returns {Promise<Map<string, ReturnType<typeof buildChatPayloadFromLookInstance>>>}
   */
  async getLookChatPayloadsByIds(lookIds, userId) {
    const map = new Map();
    const ids = [...new Set((lookIds || []).filter(Boolean).map((id) => Number(id)))].filter(
      (n) => Number.isFinite(n) && n > 0,
    );
    if (!ids.length) return map;

    const looks = await Look.findAll({
      where: { user_id: userId, id: ids },
      include: [
        {
          model: Cloth,
          as: 'clothes',
          through: { attributes: [] },
          attributes: CHAT_CLOTH_ATTRIBUTES,
        },
      ],
    });

    for (const look of looks) {
      map.set(String(look.id), buildChatPayloadFromLookInstance(look));
    }
    return map;
  }

  async findByUserId(userId) {
    const looks = await Look.findAll({
      where: { user_id: userId },
      include: [
        { model: Cloth, as: 'clothes', through: { attributes: [] } /* , attributes: ['id'] */ },
      ],
      order: [['createdAt', 'DESC']],
    });
    return looks.map((look) => serializeLook(look, look.clothes?.map((cloth) => cloth.id) ?? []));
  }

  async create(userId, data) {
    const look = await Look.create({ user_id: userId, ...data });

    const clothIds = normalizeClothIds(data.cloth_ids);

    if (clothIds.length) {
      const lookCloths = clothIds.map((cloth_id) => ({
        look_id: look.id,
        cloth_id,
      }));
      await LookCloth.bulkCreate(lookCloths);
      await updateWornAtForCloths(clothIds);
    }

    return this.findById(look.id, userId);
  }

  async update(id, userId, data) {
    const look = await this.findById(id, userId, false);
    if (!look) {
      throw new Error('Look not found');
    }

    await look.update({ title: data.title });

    if (data.cloth_ids !== undefined) {
      const clothIds = normalizeClothIds(data.cloth_ids);

      await LookCloth.destroy({ where: { look_id: id } });

      if (clothIds.length > 0) {
        const lookCloths = clothIds.map((cloth_id) => ({
          look_id: id,
          cloth_id,
        }));
        await LookCloth.bulkCreate(lookCloths);
        await updateWornAtForCloths(clothIds);
      }
    }

    return this.findById(id, userId);
  }

  async toggleLike(id, userId) {
    const look = await this.findById(id, userId, false);
    if (!look) {
      throw new Error('Look not found');
    }

    await look.update({ is_in_favorites: !look.is_in_favorites });

    return this.findById(id, userId);
  }

  async delete(id, userId) {
    const look = await this.findById(id, userId, false);
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

    await updateWornAtForCloths([clothId]);

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

  /**
   * Считает количество луков
   */
  async looksNumber(userId) {
    try {
      const looksCount = await Look.count({
        where: { user_id: userId },
      });

      return looksCount;
    } catch (err) {
      console.error('Looks count error:', err.message);
      throw err;
    }
  }

}

module.exports = new LookService();
