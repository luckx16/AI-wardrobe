const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class LookCloth extends Model {
    static associate(models) {
      LookCloth.belongsTo(models.Look, { foreignKey: 'look_id', as: 'look' });
      // LookCloth.belongsTo(models.Cloth, { foreignKey: 'cloth_id', as: 'cloth' });
    }
  }

  LookCloth.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      cloth_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      look_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'LookCloth',
      tableName: 'look_cloths',
      timestamps: true,
      underscored: false,
      indexes: [
        {
          unique: true,
          fields: ['cloth_id', 'look_id'],
        },
      ],
    },
  );

  return LookCloth;
};