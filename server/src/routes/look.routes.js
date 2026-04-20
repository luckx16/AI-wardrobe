const router = require('express').Router();
const lookController = require('../controllers/Look.controller');
const verifyAccessToken = require('../middleware/verifyAccessToken');

// Важно: /generate до /:id, иначе "generate" попадёт в параметр id.
router.post('/generate', verifyAccessToken, lookController.generateLook.bind(lookController));
router.post('/generate-title', verifyAccessToken, lookController.generateLookTitle.bind(lookController));

router
  .route('/')
  .get(verifyAccessToken, lookController.getLooks)
  .post(verifyAccessToken, lookController.createLook);

router.route('/like/:id').put(verifyAccessToken, lookController.toggleLike);

router
  .route('/:id')
  .get(verifyAccessToken, lookController.getLook)
  .put(verifyAccessToken, lookController.updateLook)
  .delete(verifyAccessToken, lookController.deleteLook);

router.route('/:id/cloths').post(verifyAccessToken, lookController.addClothToLook);

router.route('/:id/cloths/:clothId').delete(verifyAccessToken, lookController.removeClothFromLook);

module.exports = router;
