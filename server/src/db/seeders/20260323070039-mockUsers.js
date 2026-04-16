const hashPassword = require('../../utils/hashPassword');

module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.bulkInsert('Users', [
      {
        name: 'Max',
        surname: null,
        age: null,
        email: 'max@mail.ru',
        password: hashPassword('12345678Qq!'),
        telephone: null,
        verified: false,
      },
      {
        name: 'Anna',
        surname: null,
        age: null,
        email: 'anna@mail.ru',
        password: hashPassword('12345678Qq!'),
        telephone: null,
        verified: false,
      },
      {
        name: 'Bob',
        surname: null,
        age: null,
        email: 'bob@gmail.com',
        password: hashPassword('12345678Qq!'),
        telephone: null,
        verified: false,
      },
    ], {});

  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', null, {});
  }
};
