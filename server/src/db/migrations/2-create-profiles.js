module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('CREATE TYPE enum_profiles_skin_tone AS ENUM (\'fair\', \'light\', \'medium\', \'olive\', \'tan\', \'brown\', \'dark\')');
    await queryInterface.sequelize.query('CREATE TYPE enum_profiles_contrast AS ENUM (\'low\', \'medium\', \'high\')');
    await queryInterface.sequelize.query('CREATE TYPE enum_profiles_proportion AS ENUM (\'pear\', \'apple\', \'hourglass\', \'rectangle\', \'inverted_triangle\')');

    await queryInterface.createTable('profiles', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      skin_tone: {
        type: 'enum_profiles_skin_tone',
        allowNull: true,
      },
      contrast: {
        type: 'enum_profiles_contrast',
        allowNull: true,
      },
      portrait_photo: { type: Sequelize.TEXT },
      body_photo: { type: Sequelize.TEXT },
      height: { type: Sequelize.FLOAT },
      waist: { type: Sequelize.FLOAT },
      bust: { type: Sequelize.FLOAT },
      hips: { type: Sequelize.FLOAT },
      foot_length: { type: Sequelize.FLOAT },
      proportion: {
        type: 'enum_profiles_proportion',
        allowNull: true,
      },
      wishes: { type: Sequelize.TEXT },
      prefs: { 
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      dislikes: { 
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      additions: { type: Sequelize.TEXT },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('profiles', ['user_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('profiles');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_profiles_skin_tone');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_profiles_contrast');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_profiles_proportion');
  },
};