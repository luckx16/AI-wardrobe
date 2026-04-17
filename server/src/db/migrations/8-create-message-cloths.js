'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('message_cloths', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      cloth_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'Cloths', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      message_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'chat_messages', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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

    await queryInterface.addIndex('message_cloths', ['cloth_id', 'message_id'], { unique: true });
    await queryInterface.addIndex('message_cloths', ['message_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('message_cloths');
  },
};
