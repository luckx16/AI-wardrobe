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

function nonEmpty(v) {
  if (v == null) return null;
  const s = String(v).trim();
  return s ? s : null;
}

function normalizeWeather(weather) {
  if (!weather || typeof weather !== 'object') return null;
  const normalized = {
    temperature: nonEmpty(weather.temperature),
    feels_like: nonEmpty(weather.feels_like),
    description: nonEmpty(weather.description),
    humidity: nonEmpty(weather.humidity),
    wind_speed: nonEmpty(weather.wind_speed),
    location: nonEmpty(weather.location),
  };
  const hasAny = Object.values(normalized).some(Boolean);
  return hasAny ? normalized : null;
}

function mapCurrentWeatherResponse(current, location) {
  return normalizeWeather({
    temperature: String(current.temperature_2m),
    feels_like: String(current.apparent_temperature),
    description: resolveWeatherDescription(current.weather_code),
    humidity: String(current.relative_humidity_2m),
    wind_speed: String(current.wind_speed_10m),
    location,
  });
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
  static _cache = new Map(); // key -> { atMs, value }
  static CACHE_TTL_MS = 10 * 60 * 1000;

  static _getCached(key) {
    const hit = WeatherService._cache.get(key);
    if (!hit) return null;
    if (Date.now() - hit.atMs > WeatherService.CACHE_TTL_MS) {
      WeatherService._cache.delete(key);
      return null;
    }
    return hit.value;
  }

  static _setCached(key, value) {
    WeatherService._cache.set(key, { atMs: Date.now(), value });
    if (WeatherService._cache.size > 200) {
      const firstKey = WeatherService._cache.keys().next().value;
      if (firstKey) WeatherService._cache.delete(firstKey);
    }
  }

  static async getCurrentWeather(city) {
    try {
      const cityKey = nonEmpty(city);
      if (!cityKey) {
        throw new Error('City is required');
      }
      const cacheKey = `city:${cityKey.toLowerCase()}`;
      const cached = WeatherService._getCached(cacheKey);
      if (cached) return cached;

      const geocodeResponse = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
        timeout: 7000,
        params: {
          name: cityKey,
          count: 1,
          language: 'ru',
          format: 'json',
        },
      });
      const firstResult = geocodeResponse.data?.results?.[0];

      if (!firstResult) {
        throw new Error(`City not found: ${cityKey}`);
      }

      const locationName = [firstResult.name, firstResult.country].filter(Boolean).join(', ') || cityKey;
      const weather = await getOpenMeteoCurrentWeather(firstResult.latitude, firstResult.longitude, locationName);
      WeatherService._setCached(cacheKey, weather);
      return weather;
    } catch (error) {
      console.error('Weather service error:', error.message);
      throw new Error(`Failed to fetch weather for ${city}`);
    }
  }

  static async getWeatherByCoords(lat, lon) {
    try {
      const latNum = Number(lat);
      const lonNum = Number(lon);
      if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) {
        throw new Error('lat/lon must be numbers');
      }
      const cacheKey = `coords:${latNum.toFixed(4)},${lonNum.toFixed(4)}`;
      const cached = WeatherService._getCached(cacheKey);
      if (cached) return cached;

      const weather = await getOpenMeteoCurrentWeather(latNum, lonNum, `${latNum}, ${lonNum}`);
      WeatherService._setCached(cacheKey, weather);
      return weather;
    } catch (error) {
      console.error('Weather service error:', error.message);
      throw new Error(`Failed to fetch weather for coordinates ${lat}, ${lon}`);
    }
  }
}

module.exports = WeatherService;
