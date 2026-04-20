'use strict';
const { Model } = require('sequelize');
const { CATEGORIES, SECTIONS } = require('../utlis/category');

module.exports = (sequelize, DataTypes) => {
  class Cloth extends Model {
    static associate(models) {
      Cloth.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
      });
      Cloth.belongsToMany(models.Look, {
        through: models.LookCloth,
        foreignKey: 'cloth_id',
        otherKey: 'look_id',
        as: 'looks',
      });
      Cloth.hasMany(models.LookCloth, {
        foreignKey: 'cloth_id',
        otherKey: 'look_id',
        as: 'lookCloths',
      });

      Cloth.belongsToMany(models.ChatMessage, {
        through: models.MessageCloth,
        foreignKey: 'cloth_id',
        otherKey: 'message_id',
        as: 'messages',
      });
    }
  }

  Cloth.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT,
      },
      title: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      brand: DataTypes.TEXT,
      material: DataTypes.TEXT,
      color: DataTypes.TEXT,
      category: {
        type: DataTypes.ENUM(...CATEGORIES),
        allowNull: true,
      },
      section: {
        type: DataTypes.ENUM(...SECTIONS),
        allowNull: false,
      },
      season: {
        type: DataTypes.ENUM('лето', 'зима', 'весна', 'осень', 'всесезон'),
        allowNull: true,
      },
      image: DataTypes.TEXT,
      worn_at: DataTypes.DATEONLY,
      ai_metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      processing_status: {
        type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
        defaultValue: 'pending',
      },
    },
    {
      sequelize,
      modelName: 'Cloth',
      tableName: 'Cloths',
      timestamps: true,
    },
  );

  return Cloth;
};
