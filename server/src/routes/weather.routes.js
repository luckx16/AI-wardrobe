const router = require('express').Router();
const WeatherController = require('../controllers/Weather.controller');

router.route('/')
    .get(WeatherController.getWeather);
    
router.route('/coords')
    .get(WeatherController.getWeatherByCoords);

module.exports = router;
    