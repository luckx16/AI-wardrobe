const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MessageCloth extends Model {
    static associate(models) {
      MessageCloth.belongsTo(models.Cloth, { foreignKey: 'cloth_id', as: 'cloth' });
      MessageCloth.belongsTo(models.ChatMessage, { foreignKey: 'message_id', as: 'message' });
    }
  }

  MessageCloth.init(
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
      message_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'MessageCloth',
      tableName: 'message_cloths',
      timestamps: true,
      underscored: false,
      indexes: [
        {
          unique: true,
          fields: ['cloth_id', 'message_id'],
        },
      ],
    },
  );

  return MessageCloth;
};
