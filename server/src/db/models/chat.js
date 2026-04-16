const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Chat extends Model {
    static associate(models) {
      Chat.hasMany(models.ChatMessage, { foreignKey: 'chat_id', as: 'messages' });
    }
  }

  Chat.init(
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
      name: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Chat',
      tableName: 'chats',
      timestamps: true,
    },
  );

  return Chat;
};
