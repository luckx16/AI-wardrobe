const router = require('express').Router();
const eventController = require('../controllers/eventController');
const verifyAccessToken = require('../middleware/verifyAccessToken');

router.route('/').get(/* verifyAccessToken, */ eventController.getAllEvents).post(
  /* verifyAccessToken, */
  eventController.createEvent,
);

router
  .route('/:id')
  .get(/* verifyAccessToken, */ eventController.getEvent)
  .put(/* verifyAccessToken, */ eventController.updateEvent)
  .delete(/* verifyAccessToken, */ eventController.deleteEvent);

module.exports = router;
