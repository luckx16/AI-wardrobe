const router = require('express').Router();
const lookController = require('../controllers/lookController');
const verifyAccessToken = require('../middleware/verifyAccessToken')

router.route('/')
    .get(verifyAccessToken, lookController.getLooks)
    .post(verifyAccessToken, lookController.createLook)
    
router.route('/:id')
    .get(verifyAccessToken, lookController.getLook)
    .put(verifyAccessToken, lookController.updateLook)
    .delete(verifyAccessToken, lookController.deleteLook);

router.route('/:id/cloths')
    .post(verifyAccessToken, lookController.addClothToLook)

router.route('/:id/cloths/:clothId')
    .delete(verifyAccessToken, lookController.removeClothFromLook)

module.exports = router;