const WeatherService = require('../services/Weather.service');
const formatResponse = require('../utils/formatResponse');

const getWeather = async (req, res) => {
    const { city } = req.query;

    // Валидация
    if (!city || city.trim().length === 0) {
        return res.status(400).json(
            formatResponse(400, 'Bad Request', null, 'Parameter "city" is required')
        );
    }

    try {
        const weatherData = await WeatherService.getCurrentWeather(city);
        
        res.status(200).json(
            formatResponse(200, 'Weather data retrieved successfully', weatherData)
        );
        
    } catch (error) {
        console.error('Weather controller error:', error.message);
        
        res.status(500).json(
            formatResponse(500, 'Internal Server Error', null, error.message)
        );
    }
};

const getWeatherByCoords = async (req, res) => {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
        return res.status(400).json(
            formatResponse(400, 'Bad Request', null, 'Parameters "lat" and "lon" are required')
        );
    }

    // Проверка, что координаты - числа
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    
    if (isNaN(latNum) || isNaN(lonNum)) {
        return res.status(400).json(
            formatResponse(400, 'Bad Request', null, 'Invalid coordinates format')
        );
    }

    try {
        const weatherData = await WeatherService.getWeatherByCoords(latNum, lonNum);
        
        res.status(200).json(
            formatResponse(200, 'Weather data retrieved successfully', weatherData)
        );
        
    } catch (error) {
        console.error('Weather controller error:', error.message);
        
        res.status(500).json(
            formatResponse(500, 'Internal Server Error', null, error.message)
        );
    }
};

module.exports = {
    getWeather,
    getWeatherByCoords
};