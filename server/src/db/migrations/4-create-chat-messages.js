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
        type: Sequelize.TEXT,
        allowNull: false,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      image_prompt: {
        type: Sequelize.TEXT,
        allowNull: true,
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
    await queryInterface.addIndex('chat_messages', ['createdAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('chat_messages');
  },
};
