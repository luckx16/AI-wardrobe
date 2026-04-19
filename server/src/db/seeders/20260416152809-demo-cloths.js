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
      },
      {
        title: 'Голубая рубашка',
        user_id: 1,
        brand: 'Zara',
        material: 'Хлопок',
        color: 'Голубой',
        category: 'рубашка',
        season: 'весна',
        image: 'processed-blue-shirt.png',
        worn_at: null,
        ai_metadata: JSON.stringify({
          confidence: 0.93,
          detected_color: 'light blue',
          detected_material: 'cotton',
          processed_at: new Date().toISOString()
        }),
        processing_status: 'completed',
      },
      {
        title: 'Серый свитер',
        user_id: 1,
        brand: 'Uniqlo',
        material: 'Шерсть',
        color: 'Серый',
        category: 'свитер',
        season: 'зима',
        image: 'processed-gray-sweater.png',
        worn_at: null,
        ai_metadata: JSON.stringify({
          confidence: 0.94,
          detected_color: 'gray',
          detected_material: 'wool',
          processed_at: new Date().toISOString()
        }),
        processing_status: 'completed',
      },
      {
        title: 'Бежевое худи',
        user_id: 1,
        brand: 'H&M',
        material: 'Хлопок',
        color: 'Бежевый',
        category: 'худи',
        season: 'осень',
        image: 'processed-beige-hoodie.png',
        worn_at: null,
        ai_metadata: JSON.stringify({
          confidence: 0.92,
          detected_color: 'beige',
          detected_material: 'cotton',
          processed_at: new Date().toISOString()
        }),
        processing_status: 'completed',
      },
      {
        title: 'Черные брюки',
        user_id: 1,
        brand: 'Massimo Dutti',
        material: 'Шерсть',
        color: 'Черный',
        category: 'брюки',
        season: 'всесезон',
        image: 'processed-black-trousers.png',
        worn_at: null,
        ai_metadata: JSON.stringify({
          confidence: 0.96,
          detected_color: 'black',
          detected_material: 'wool blend',
          processed_at: new Date().toISOString()
        }),
        processing_status: 'completed',
      },
      {
        title: 'Синие джинсы',
        user_id: 1,
        brand: 'Levis',
        material: 'Деним',
        color: 'Синий',
        category: 'брюки',
        season: 'всесезон',
        image: 'processed-blue-jeans.png',
        worn_at: null,
        ai_metadata: JSON.stringify({
          confidence: 0.95,
          detected_color: 'blue',
          detected_material: 'denim',
          processed_at: new Date().toISOString()
        }),
        processing_status: 'completed',
      },
      {
        title: 'Бежевая юбка миди',
        user_id: 1,
        brand: 'Mango',
        material: 'Вискоза',
        color: 'Бежевый',
        category: 'юбка',
        season: 'весна',
        image: 'processed-beige-midi-skirt.png',
        worn_at: null,
        ai_metadata: JSON.stringify({
          confidence: 0.9,
          detected_color: 'beige',
          detected_material: 'viscose',
          processed_at: new Date().toISOString()
        }),
        processing_status: 'completed',
      },
      {
        title: 'Джинсовая куртка',
        user_id: 1,
        brand: 'Pull&Bear',
        material: 'Деним',
        color: 'Синий',
        category: 'куртка',
        season: 'весна',
        image: 'processed-denim-jacket.png',
        worn_at: null,
        ai_metadata: JSON.stringify({
          confidence: 0.94,
          detected_color: 'blue',
          detected_material: 'denim',
          processed_at: new Date().toISOString()
        }),
        processing_status: 'completed',
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
      },
      {
        title: 'Белые кроссовки',
        user_id: 1,
        brand: 'Adidas',
        material: 'Кожа',
        color: 'Белый',
        category: 'обувь',
        season: 'всесезон',
        image: 'processed-white-sneakers.png',
        worn_at: null,
        ai_metadata: JSON.stringify({
          confidence: 0.97,
          detected_color: 'white',
          detected_material: 'leather',
          processed_at: new Date().toISOString()
        }),
        processing_status: 'completed',
      },
      {
        title: 'Черные лоферы',
        user_id: 1,
        brand: 'Ecco',
        material: 'Кожа',
        color: 'Черный',
        category: 'обувь',
        season: 'всесезон',
        image: 'processed-black-loafers.png',
        worn_at: null,
        ai_metadata: JSON.stringify({
          confidence: 0.91,
          detected_color: 'black',
          detected_material: 'leather',
          processed_at: new Date().toISOString()
        }),
        processing_status: 'completed',
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
      },
      {
        title: 'Черный ремень',
        user_id: 1,
        brand: 'Boss',
        material: 'Кожа',
        color: 'Черный',
        category: 'аксессуары',
        season: 'всесезон',
        image: 'processed-black-belt.png',
        worn_at: null,
        ai_metadata: JSON.stringify({
          confidence: 0.89,
          detected_color: 'black',
          detected_material: 'leather',
          processed_at: new Date().toISOString()
        }),
        processing_status: 'completed',
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Cloths', null, {});
  }
};
