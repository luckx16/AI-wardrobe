const router = require('express').Router();
const DashboardController = require('../controllers/Dashboard.controller');
const verifyAccessToken = require('../middleware/verifyAccessToken');

router.get('/numbers', verifyAccessToken, DashboardController.getDashboardNumbers);
router.get('/sections', verifyAccessToken, DashboardController.getDashboardCategory);

module.exports = router;
