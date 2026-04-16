const hashPassword = require('../../utils/hashPassword');

module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.bulkInsert('Users', [
      {
        name: 'Max',
        email: 'max@mail.ru',
        password: hashPassword('12345678Qq!')
      },
      {
        name: 'Anna',
        email: 'anna@mail.ru',
        password: hashPassword('12345678Qq!')
      },
      {
        name: 'Bob',
        email: 'bob@gmail.com',
        password: hashPassword('12345678Qq!')
      },
    ], {});

  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', null, {});
  }
};
