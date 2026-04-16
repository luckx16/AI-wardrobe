'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Cloth extends Model {
    static associate(models) {
      Cloth.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
      });
      Cloth.hasMany(models.LookCloth, {
        foreignKey: 'cloth_id',
        as: 'lookCloth',
      });
      // Cloth.hasMany(models.MessageCloth, {
      //   foreignKey: 'cloth_id',
      //   as: 'messageCloth',
      // });
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
        type: DataTypes.ENUM(
          'футболка',
          'рубашка',
          'платье',
          'брюки',
          'юбка',
          'куртка',
          'свитер',
          'худи',
          'шорты',
          'обувь',
          'аксессуары',
          'другое',
        ),
        allowNull: true,
      },
      season: {
        type: DataTypes.ENUM('лето', 'зима', 'весна', 'осень', 'всесезон'),
        allowNull: true,
      },
      image: DataTypes.TEXT,
      worn_at: DataTypes.DATE,
      ai_metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      processing_status: {
        type: DataTypes.ENUM('pending', 'completed', 'failed'),
        defaultValue: 'pending',
      },
    },
    {
      sequelize,
      modelName: 'Cloth',
      tableName: 'Cloths',
    },
  );

  return Cloth;
};
