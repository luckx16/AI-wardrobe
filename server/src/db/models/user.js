const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasOne(models.Profile, { foreignKey: 'user_id', as: 'profile' });
      User.hasMany(models.Look, { foreignKey: 'user_id', as: 'looks' });
      User.hasMany(models.Event, { foreignKey: 'user_id', as: 'events' });
      User.hasMany(models.Chat, { foreignKey: 'user_id', as: 'chats' });
    }

    static validateEmail(email) {
      const emailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
      return emailPattern.test(email);
    }

    static validatePassword(password) {
      const hasUpperCase = /[A-Z]/;
      const hasLowerCase = /[a-z]/;
      const hasNumbers = /\d/;
      const hasSpecialCharacters = /[!@#$%^&*()-,.?":{}|<>]/;
      const isValidLength = password.length >= 8;

      if (
        !hasUpperCase.test(password) ||
        !hasLowerCase.test(password) ||
        !hasNumbers.test(password) ||
        !hasSpecialCharacters.test(password) ||
        !isValidLength
      ) {
        return false;
      }

      return true;
    }

    static validateSignInData({ email, password }) {
      if (!email || typeof email !== 'string' || email.trim().length === 0) {
        return {
          isValid: false,
          error: 'Email не может быть пустым',
        };
      }

      if (!password || typeof password !== 'string' || password.trim().length === 0) {
        return {
          isValid: false,
          error: 'Пароль не может быть пустым',
        };
      }

      return {
        isValid: true,
        error: null,
      };
    }

    static validateSignUpData({ name, email, password }) {
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return {
          isValid: false,
          error: 'Имя не может быть пустым',
        };
      }

      if (
        !email ||
        typeof email !== 'string' ||
        email.trim().length === 0 ||
        !this.validateEmail(email)
      ) {
        return {
          isValid: false,
          error: 'Введите корректный email',
        };
      }

      if (
        !password ||
        typeof password !== 'string' ||
        password.trim().length === 0 ||
        !this.validatePassword(password)
      ) {
        return {
          isValid: false,
          error:
            'Пароль должен содержать минимум 8 символов, одну заглавную букву, одну строчную букву и один специальный символ',
        };
      }

      return {
        isValid: true,
        error: null,
      };
    }
  }

  User.init(
    {
      name: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      surname: DataTypes.TEXT,
      age: DataTypes.INTEGER,
      email: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      telephone: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'Users',
      timestamps: true,
    },
  );
  return User;
};
