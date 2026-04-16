const { Cloth } = require('../db/models');

class ClothService {
  // C
  static async createCloth(clothData) {
    return Cloth.create(clothData)
      .then((cloth) => cloth)
      .catch((err) => console.error(err.message));
  }
}

module.exports = ClothService;
