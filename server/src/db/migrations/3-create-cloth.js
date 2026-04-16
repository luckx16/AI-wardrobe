'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Cloths', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT,
      },
      title: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Название вещи',
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      brand: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Бренд',
      },
      material: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Материал',
      },
      color: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Цвет',
      },
      category: {
        type: Sequelize.ENUM,
        values: [
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
        ],
        allowNull: true,
        comment: 'Категория одежды',
      },
      season: {
        type: Sequelize.ENUM,
        values: ['лето', 'зима', 'весна', 'осень', 'всесезон'],
        allowNull: true,
        comment: 'Сезон',
      },
      image: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      worn_at: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Когда последний раз надевали',
      },
      ai_metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: 'Данные от ИИ: цвет, материал, уверенность и т.д.',
      },
      processing_status: {
        type: Sequelize.ENUM,
        values: ['pending', 'processing', 'completed', 'failed'],
        allowNull: false,
        defaultValue: 'pending',
        comment: 'Статус обработки изображения',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    // Добавляем индексы
    await queryInterface.addIndex('Cloths', ['user_id']);
    await queryInterface.addIndex('Cloths', ['processing_status']);
    await queryInterface.addIndex('Cloths', ['category']);
    await queryInterface.addIndex('Cloths', ['user_id', 'processing_status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Cloths');
  },
};
