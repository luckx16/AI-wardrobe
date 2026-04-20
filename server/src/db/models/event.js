const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Event extends Model {
    static associate(models) {
      Event.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      Event.belongsTo(models.Look, { foreignKey: 'look_id', as: 'look' });
      Event.hasMany(models.ChatMessage, { foreignKey: 'event_id', as: 'chatMessages' });
    }
  }

  Event.init(
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
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      activity_type: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      look_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Event',
      tableName: 'events',
      timestamps: true,
      underscored: false,
    },
  );

  return Event;
};
