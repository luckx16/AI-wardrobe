const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Profile extends Model {
    static associate(models) {
      Profile.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      // Profile.hasMany(models.Event, { foreignKey: 'user_id', as: 'events' });
    }
  }

  Profile.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      skin_tone: {
        type: DataTypes.ENUM('fair', 'light', 'medium', 'olive', 'tan', 'brown', 'dark'),
        allowNull: true,
      },
      contrast: {
        type: DataTypes.ENUM('low', 'medium', 'high'),
        allowNull: true,
      },
      portrait_photo: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      body_photo: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      height: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      waist: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      bust: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      hips: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      foot_length: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      proportion: {
        type: DataTypes.ENUM('pear', 'apple', 'hourglass', 'rectangle', 'inverted_triangle'),
        allowNull: true,
      },
      wishes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      prefs: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
      },
      dislikes: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
      },
      additions: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Profile',
      tableName: 'profiles',
      timestamps: true,
      underscored: true,
    }
  );

  return Profile;
};