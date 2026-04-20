const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Look extends Model {
    toJSON() {
      const raw = super.toJSON();
      return {
        ...raw,
        id: raw.id?.toString(),
        user_id: raw.user_id?.toString(),
      };
    }

    static associate(models) {
      Look.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      Look.hasMany(models.Event, { foreignKey: 'look_id', as: 'events' });
      Look.belongsToMany(models.Cloth, {
        through: models.LookCloth,
        foreignKey: 'look_id',
        otherKey: 'cloth_id',
        as: 'clothes',
      });
      Look.hasMany(models.ChatMessage, {
        foreignKey: 'suggested_look_id',
        as: 'suggestedMessages',
      });
    }
  }

  Look.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      title: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
      },
      is_in_favorites: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: 'Look',
      tableName: 'looks',
      timestamps: true,
      underscored: false,
    },
  );

  return Look;
};
