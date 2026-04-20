const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ChatMessage extends Model {
    static associate(models) {
      ChatMessage.belongsTo(models.Chat, { foreignKey: 'chat_id', as: 'chat' });
      ChatMessage.belongsTo(models.Look, { foreignKey: 'suggested_look_id', as: 'suggestedLook' });
      ChatMessage.belongsTo(models.Event, { foreignKey: 'event_id', as: 'linkedEvent' });

      ChatMessage.belongsToMany(models.Cloth, {
        through: models.MessageCloth,
        foreignKey: 'message_id',
        otherKey: 'cloth_id',
        as: 'clothes',
      });
    }
  }

  ChatMessage.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      chat_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM('user', 'assistant', 'system'),
        allowNull: false,
      },
      content: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      suggested_look_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      event_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'ChatMessage',
      tableName: 'chat_messages',
      timestamps: true,
    },
  );

  return ChatMessage;
};
