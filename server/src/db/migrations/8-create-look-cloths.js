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
        // references: { model: 'cloths', key: 'id' },
        // onUpdate: 'CASCADE',
        // onDelete: 'CASCADE',
      },
      look_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'looks', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
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