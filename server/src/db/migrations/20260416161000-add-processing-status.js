'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Добавляем значение 'processing' в существующий ENUM
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Cloths_processing_status" ADD VALUE 'processing';
    `);
  },

  async down(queryInterface, Sequelize) {
    // Удалять значение из ENUM в PostgreSQL нельзя, только пересоздать тип
    // Это безопасная операция - просто ничего не делаем
  },
};
