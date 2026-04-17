const axios = require('axios');

class WeatherService {
  static async getCurrentWeather(city) {
    try {
      const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;
      const response = await axios.get(url, {
        timeout: 5000,
        headers: {
          'User-Agent': 'YourApp/1.0',
        },
      });

      if (!response.data?.current_condition?.[0]) {
        throw new Error('Invalid response from weather service');
      }

      const current = response.data.current_condition[0];

      return {
        temperature: current.temp_C,
        feels_like: current.FeelsLikeC,
        description: current.weatherDesc[0].value,
        humidity: current.humidity,
        wind_speed: current.windspeedKmph,
        wind_dir: current.winddir16Point,
        pressure: current.pressure,
        uv_index: current.uvIndex,
        cloudcover: current.cloudcover,
        visibility: current.visibility,
        precip_mm: current.precipMM,
        location: response.data.nearest_area?.[0]?.areaName?.[0]?.value || city,
      };
    } catch (error) {
      console.error('Weather service error:', error.message);
      throw new Error(`Failed to fetch weather for ${city}`);
    }
  }

  static async getWeatherByCoords(lat, lon) {
    try {
      const url = `https://wttr.in/${lat},${lon}?format=j1`;
      const response = await axios.get(url, {
        timeout: 5000,
      });

      const current = response.data.current_condition[0];

      return {
        temperature: current.temp_C,
        feels_like: current.FeelsLikeC,
        description: current.weatherDesc[0].value,
        humidity: current.humidity,
        wind_speed: current.windspeedKmph,
        location: response.data.nearest_area?.[0]?.areaName?.[0]?.value || `${lat}, ${lon}`,
      };
    } catch (error) {
      console.error('Weather service error:', error.message);
      throw new Error(`Failed to fetch weather for coordinates ${lat}, ${lon}`);
    }
  }
}

module.exports = WeatherService;
