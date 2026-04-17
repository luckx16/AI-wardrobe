'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('chat_messages', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      chat_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'chats', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      role: {
        type: Sequelize.ENUM('user', 'assistant', 'system'),
        allowNull: false,
      },
      content: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      suggested_look_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: { model: 'looks', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      event_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: { model: 'events', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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

    await queryInterface.addIndex('chat_messages', ['chat_id']);
    await queryInterface.addIndex('chat_messages', ['suggested_look_id']);
    await queryInterface.addIndex('chat_messages', ['event_id']);
    await queryInterface.addIndex('chat_messages', ['createdAt']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('chat_messages');
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_chat_messages_role";`);
  },
};
