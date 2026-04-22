import { WEATHER_API_ROUTES } from '@/shared/constants/weatherApiRoutes';
import { axiosInstance } from '@/shared/lib/axiosInstance';
import { UserCoords } from '@/shared/lib/userLocation';
import { ServerResponseType } from '@/shared/types';

import { WeatherByCoordsResponse } from '../model/types';

export const fetchWeatherByCoordsApi = async (
  lat: number,
  lon: number,
): Promise<WeatherByCoordsResponse | null> => {
  try {
    const { data } = await axiosInstance.get<ServerResponseType<WeatherByCoordsResponse>>(
      WEATHER_API_ROUTES.WEATHER_BY_COORDS,
      {
        params: { lat, lon },
      },
    );
    return data.data ?? null;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const fetchWeatherByCityApi = async (
  city: string,
): Promise<WeatherByCoordsResponse | null> => {
  try {
    const { data } = await axiosInstance.get<ServerResponseType<WeatherByCoordsResponse>>(
      WEATHER_API_ROUTES.WEATHER,
      {
        params: { city },
      },
    );
    return data.data ?? null;
  } catch (error) {
    console.log(error);

    return null;
  }
};

export const fetchWeatherApi = async (locationInfo: UserCoords | string | undefined) => {
  try {
    const coords = (typeof locationInfo === 'object' && locationInfo) || null;
    const city = (typeof locationInfo === 'string' && locationInfo) || null;

    if (!coords && !city) return null;

    const weatherData = coords
      ? await fetchWeatherByCoordsApi(coords.lat, coords.lon)
      : city
        ? await fetchWeatherByCityApi(city)
        : null;

    return weatherData;
  } catch (error) {
    console.log(error);
    return null;
  }
};
