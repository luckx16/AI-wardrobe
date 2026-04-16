const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Chat extends Model {
    static associate(models) {
      Chat.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
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
      title: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      context_summary: {
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
