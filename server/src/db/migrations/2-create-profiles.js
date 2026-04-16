module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('profiles', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      skin_tone: {
        type: Sequelize.ENUM('cool', 'warm', 'neutral'),
        allowNull: true,
      },
      contrast: {
        type: Sequelize.ENUM('low', 'medium', 'high'),
        allowNull: true,
      },
      portrait_photo: { type: Sequelize.TEXT, allowNull: true },
      body_photo: { type: Sequelize.TEXT, allowNull: true },
      height: { type: Sequelize.FLOAT, allowNull: true },
      waist: { type: Sequelize.FLOAT, allowNull: true },
      bust: { type: Sequelize.FLOAT, allowNull: true },
      hips: { type: Sequelize.FLOAT, allowNull: true },
      foot_length: { type: Sequelize.FLOAT, allowNull: true },
      proportion: {
        type: Sequelize.ENUM('standard', 'long', 'short'),
        allowNull: true,
      },
      wishes: { type: Sequelize.TEXT, allowNull: true },
      prefs: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
      },
      dislikes: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
      },
      additions: { type: Sequelize.TEXT, allowNull: true },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.addIndex('profiles', ['user_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('profiles');
  },
};