module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_profiles_skin_tone') THEN
          CREATE TYPE enum_profiles_skin_tone AS ENUM ('cool', 'warm', 'neutral');
        END IF;
      END$$;
    `);
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_profiles_contrast') THEN
          CREATE TYPE enum_profiles_contrast AS ENUM ('low', 'medium', 'high');
        END IF;
      END$$;
    `);
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_profiles_proportion') THEN
          CREATE TYPE enum_profiles_proportion AS ENUM ('standard', 'long', 'short');
        END IF;
      END$$;
    `);

    await queryInterface.createTable('profiles', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
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
      portrait_photo: { type: Sequelize.TEXT, allowNull: true },
      body_photo: { type: Sequelize.TEXT, allowNull: true },
      height: { type: Sequelize.FLOAT, allowNull: true },
      waist: { type: Sequelize.FLOAT, allowNull: true },
      bust: { type: Sequelize.FLOAT, allowNull: true },
      hips: { type: Sequelize.FLOAT, allowNull: true },
      foot_length: { type: Sequelize.FLOAT, allowNull: true },
      proportion: {
        type: 'enum_profiles_proportion',
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
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_profiles_skin_tone');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_profiles_contrast');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_profiles_proportion');
  },
};