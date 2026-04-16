'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert('Cloths', [
      {
        title: 'Белая футболка',
        user_id: 1,
        brand: 'Nike',
        material: 'Хлопок',
        color: 'Белый',
        category: 'футболка',
        season: 'лето',
        image: 'processed-white-tshirt.png',
        worn_at: null,
        ai_metadata: JSON.stringify({
          confidence: 0.95,
          detected_color: 'white',
          detected_material: 'cotton',
          processed_at: new Date().toISOString()
        }),
        processing_status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Кожаные ботинки',
        user_id: 1,
        brand: 'Timberland',
        material: 'Кожа',
        color: 'Коричневый',
        category: 'обувь',
        season: 'осень',
        image: 'processed-brown-boots.png',
        worn_at: null,
        ai_metadata: JSON.stringify({
          confidence: 0.91,
          detected_color: 'brown',
          detected_material: 'leather',
          processed_at: new Date().toISOString()
        }),
        processing_status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Солнцезащитные очки',
        user_id: 1,
        brand: 'Ray-Ban',
        material: 'Пластик',
        color: 'Черный',
        category: 'аксессуары',
        season: 'лето',
        image: 'processed-sunglasses.png',
        worn_at: null,
        ai_metadata: JSON.stringify({
          confidence: 0.97,
          detected_color: 'black',
          detected_material: 'plastic',
          processed_at: new Date().toISOString()
        }),
        processing_status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Cloths', null, {});
  }
};