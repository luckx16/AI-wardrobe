module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('look_cloths', {
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
      look_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'looks', key: 'id' },
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

    await queryInterface.addIndex('look_cloths', ['cloth_id', 'look_id'], { unique: true });
    await queryInterface.addIndex('look_cloths', ['look_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('look_cloths');
  },
};
