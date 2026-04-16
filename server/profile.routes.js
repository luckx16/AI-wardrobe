const router = require('express').Router();
const profileController = require('../controllers/profileController');
const verifyAccessToken = require('../middleware/verifyAccessToken')

router.route('/')
    .get(verifyAccessToken, profileController.getProfile)
    .post(verifyAccessToken, profileController.createProfile)
    .put(verifyAccessToken, profileController.updateProfile)
    .patch(verifyAccessToken, profileController.upsertProfile)
    .delete(verifyAccessToken, profileController.deleteProfile);

module.exports = router;