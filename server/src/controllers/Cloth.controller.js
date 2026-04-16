const ClothService = require('../services/Cloth.service');
const formatResponse = require('../utils/formatResponse');

class ClothController {
// C
    static async createCloth(req, res) {
        try {
            const { user } = res.locals;
            const { title, brand, material , color, category, season } = req.body;
            const newCloth = await ClothService.createNewCloth({ title, user_id: user.id, brand, material , color, category, season});
        } catch (error) {
            
        }
    }
}

module.exports = ClothController