const hashPassword = require('../../utils/hashPassword');

module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.bulkInsert('Users', [
      {
        name: 'Max',
        email: 'max@mail.ru',
        password: hashPassword('123')
      },
      {
        name: 'Anna',
        email: 'anna@mail.ru',
        password: hashPassword('123')
      },
      {
        name: 'Bob',
        email: 'bob@gmail.com',
        password: hashPassword('123')
      },
    ], {});

  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', null, {});
  }
};
