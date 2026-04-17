const axios = require('axios');

const WEATHER_CODE_DESCRIPTIONS = {
  0: 'Clear',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Light rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Light snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Light rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Light snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with light hail',
  99: 'Thunderstorm with heavy hail',
};

function resolveWeatherDescription(code) {
  return WEATHER_CODE_DESCRIPTIONS[code] || 'Unknown';
}

function mapCurrentWeatherResponse(current, location) {
  return {
    temperature: String(current.temperature_2m),
    feels_like: String(current.apparent_temperature),
    description: resolveWeatherDescription(current.weather_code),
    humidity: String(current.relative_humidity_2m),
    wind_speed: String(current.wind_speed_10m),
    location,
  };
}

async function getOpenMeteoCurrentWeather(lat, lon, location) {
  const weatherResponse = await axios.get('https://api.open-meteo.com/v1/forecast', {
    timeout: 7000,
    params: {
      latitude: lat,
      longitude: lon,
      current:
        'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code',
      wind_speed_unit: 'kmh',
    },
  });

  const current = weatherResponse.data?.current;
  if (!current) {
    throw new Error('Invalid response from weather provider');
  }

  return mapCurrentWeatherResponse(current, location);
}

class WeatherService {
  static async getCurrentWeather(city) {
    try {
      const geocodeResponse = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
        timeout: 7000,
        params: {
          name: city,
          count: 1,
          language: 'ru',
          format: 'json',
        },
      });
      const firstResult = geocodeResponse.data?.results?.[0];

      if (!firstResult) {
        throw new Error(`City not found: ${city}`);
      }

      const locationName = [firstResult.name, firstResult.country].filter(Boolean).join(', ') || city;
      return getOpenMeteoCurrentWeather(firstResult.latitude, firstResult.longitude, locationName);
    } catch (error) {
      console.error('Weather service error:', error.message);
      throw new Error(`Failed to fetch weather for ${city}`);
    }
  }

  static async getWeatherByCoords(lat, lon) {
    try {
      return getOpenMeteoCurrentWeather(lat, lon, `${lat}, ${lon}`);
    } catch (error) {
      console.error('Weather service error:', error.message);
      throw new Error(`Failed to fetch weather for coordinates ${lat}, ${lon}`);
    }
  }
}

module.exports = WeatherService;
