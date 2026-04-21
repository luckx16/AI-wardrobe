'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { Eye, Palette, Shirt, TrendingUp } from 'lucide-react';

import { CLIENT_ROUTES } from '@/shared/constants/clientRoutes';
import { USER_API_ROUTES } from '@/shared/constants/userApiRoutes';
import { axiosInstance } from '@/shared/lib/axiosInstance';
import { USER_LOCATION_UPDATED_EVENT, userLocationStorage } from '@/shared/lib/userLocation';
import type { ServerResponseType } from '@/shared/types';
import { StatsCard } from '@/shared/ui';
import { CalendarPlans, OutfitOfTheDay } from '@/widgets';
import { CategoryBreakdown } from '@/widgets/CategoryBreakdown';

import styles from './dashboard.module.css';

/*
const MOCK_STATS_DATA = [
  {
    title: 'Всего вещей',
    value: 69,
    icon: Shirt,
    subtitle: 'в гардеробе',
    trend: { value: 5, label: 'за месяц' },
  },
  {
    title: 'Образов',
    value: 12,
    icon: Palette,
    subtitle: 'сохранено',
    trend: { value: 20, label: 'за месяц' },
  },
  { title: 'Носилось', value: 43, icon: Eye, subtitle: 'за 30 дней' },
  {
    title: 'Не носилось',
    value: 26,
    icon: TrendingUp,
    subtitle: 'более 60 дней',
    trend: { value: -8, label: 'vs прошлый' },
  },
];
*/

const MOCK_OUTFIT = {
  weather: 'Погода не определена',
  items: [
    { id: 12, name: 'Синие джинсы', category: 'Низ', emoji: '👖' },
    { id: 45, name: 'Белая худи', category: 'Верх', emoji: '🧥' },
    { id: 7, name: 'Бежевый тренч', category: 'Верхняя одежда', emoji: '🧥' },
    { id: 23, name: 'Белые кроссовки', category: 'Обувь', emoji: '👟' },
  ],
  tip: 'Подберите образ с учетом температуры и осадков',
};

type WeatherByCoordsResponse = {
  temperature: string;
  description: string;
  feels_like: string;
  location?: string;
};

type DashboardNumbersResponse = {
  clothesNumber: number;
  looksNumber: number;
  wornLast30Days: number;
  notWornMoreThan30Days: number;
};

type DashboardSectionsResponse = {
  name: string;
  emoji: string;
  count: number;
  percentage: number;
}[];

const WEATHER_DESCRIPTION_RU_MAP: Record<string, string> = {
  Sunny: 'Солнечно',
  Clear: 'Ясно',
  'Partly cloudy': 'Переменная облачность',
  Cloudy: 'Облачно',
  Overcast: 'Пасмурно',
  Mist: 'Легкий туман',
  Fog: 'Туман',
  'Freezing fog': 'Ледяной туман',
  'Patchy rain possible': 'Местами возможен дождь',
  'Patchy light drizzle': 'Местами слабая морось',
  'Light drizzle': 'Слабая морось',
  'Light rain': 'Небольшой дождь',
  'Moderate rain': 'Умеренный дождь',
  'Heavy rain': 'Сильный дождь',
  'Patchy light rain': 'Местами небольшой дождь',
  'Patchy moderate rain': 'Местами умеренный дождь',
  'Patchy heavy rain': 'Местами сильный дождь',
  'Rain shower': 'Ливень',
  'Patchy snow possible': 'Местами возможен снег',
  'Light snow': 'Небольшой снег',
  'Moderate snow': 'Умеренный снег',
  'Heavy snow': 'Сильный снег',
  'Patchy sleet possible': 'Местами возможен мокрый снег',
  'Light sleet': 'Небольшой мокрый снег',
  'Moderate or heavy sleet': 'Умеренный или сильный мокрый снег',
  'Patchy freezing drizzle possible': 'Местами возможна ледяная морось',
  'Freezing drizzle': 'Ледяная морось',
  'Thundery outbreaks possible': 'Возможна гроза',
  'Patchy light rain with thunder': 'Местами небольшой дождь с грозой',
  'Moderate or heavy rain with thunder': 'Умеренный или сильный дождь с грозой',
};

const toRussianWeatherDescription = (description: string): string => {
  const normalized = description.trim();
  return WEATHER_DESCRIPTION_RU_MAP[normalized] ?? normalized;
};

const MOCK_PLANS = [
  { id: 1, date: 'Сегодня', title: 'Деловая встреча', outfit: 'Офисный стиль', color: '#8a6a4a' },
  { id: 2, date: 'Завтра', title: 'Ужин с друзьями', outfit: 'Casual вечерний', color: '#10b981' },
  { id: 3, date: 'Ср, 16 апр', title: 'Презентация', outfit: 'Формальный', color: '#f59e0b' },
  { id: 4, date: 'Пт, 18 апр', title: 'Прогулка', outfit: 'Спортивный', color: '#f43f5e' },
];

/*
const MOCK_CATEGORIES = [
  { name: 'Верх', count: 24, percentage: 35, emoji: '👕' },
  { name: 'Низ', count: 16, percentage: 23, emoji: '👖' },
  { name: 'Обувь', count: 12, percentage: 17, emoji: '👟' },
  { name: 'Верхняя одежда', count: 8, percentage: 12, emoji: '🧥' },
  { name: 'Аксессуары', count: 9, percentage: 13, emoji: '🎒' },
];
*/

export default function DashboardPage() {
  const router = useRouter();
  const [weatherText, setWeatherText] = useState<string>(MOCK_OUTFIT.weather);
  const [weatherTip, setWeatherTip] = useState<string>(MOCK_OUTFIT.tip);
  const [categories, setCategories] = useState<DashboardSectionsResponse>([]);
  const [dashboardNumbers, setDashboardNumbers] = useState<DashboardNumbersResponse>({
    clothesNumber: 0,
    looksNumber: 0,
    wornLast30Days: 0,
    notWornMoreThan30Days: 0,
  });

  const navigateToEventsPageHandler = () => {
    router.push(CLIENT_ROUTES.EVENTS);
  };

  useEffect(() => {
    const loadDashboardNumbers = async () => {
      try {
        const { data } = await axiosInstance.get<ServerResponseType<DashboardNumbersResponse>>(
          '/dashboard/numbers',
        );

        if (data.data) {
          setDashboardNumbers(data.data);
        }
      } catch (error) {
        console.error(error);
      }
    };

    const loadDashboardSections = async () => {
      try {
        const { data } = await axiosInstance.get<ServerResponseType<DashboardSectionsResponse>>(
          '/dashboard/sections',
        );

        if (data.data?.length) {
          setCategories(data.data);
        }
      } catch (error) {
        console.error(error);
      }
    };

    const fetchWeatherByCoords = async (
      lat: number,
      lon: number,
    ): Promise<WeatherByCoordsResponse | null> => {
      try {
        const { data } = await axiosInstance.get<ServerResponseType<WeatherByCoordsResponse>>(
          USER_API_ROUTES.WEATHER_BY_COORDS,
          {
            params: { lat, lon },
          },
        );
        return data.data ?? null;
      } catch {
        return null;
      }
    };

    const fetchWeatherByCity = async (city: string): Promise<WeatherByCoordsResponse | null> => {
      try {
        const { data } = await axiosInstance.get<ServerResponseType<WeatherByCoordsResponse>>(
          USER_API_ROUTES.WEATHER,
          {
            params: { city },
          },
        );
        return data.data ?? null;
      } catch {
        return null;
      }
    };

    const loadWeather = async () => {
      const coords = userLocationStorage.getCoords();
      const city = userLocationStorage.getCity();

      const weatherData =
        (coords ? await fetchWeatherByCoords(coords.lat, coords.lon) : null) ||
        (city ? await fetchWeatherByCity(city) : null);

      if (!weatherData) {
        if (!coords && !city) {
          setWeatherText('Введите город, чтобы увидеть погоду');
          setWeatherTip('Укажите город в шапке, и данные обновятся автоматически');
          return;
        }

        setWeatherText('Не удалось загрузить погоду');
        setWeatherTip('Попробуйте снова или укажите другой город в шапке');
        return;
      }

      try {
        const weatherLine = `${weatherData.temperature}°C, ${toRussianWeatherDescription(weatherData.description)}`;
        setWeatherText(weatherLine);
        setWeatherTip(`Ощущается как ${weatherData.feels_like}°C`);
      } catch {
        setWeatherText('Не удалось загрузить погоду');
        setWeatherTip('Попробуйте снова или укажите другой город в шапке');
      }
    };
    //в ${weatherData.location}
    void loadWeather();
    void loadDashboardNumbers();
    void loadDashboardSections();

    const onUserLocationUpdated = () => {
      void loadWeather();
    };

    window.addEventListener(USER_LOCATION_UPDATED_EVENT, onUserLocationUpdated);

    return () => {
      window.removeEventListener(USER_LOCATION_UPDATED_EVENT, onUserLocationUpdated);
    };
  }, []);

  const outfitWithWeather = useMemo(
    () => ({
      ...MOCK_OUTFIT,
      weather: weatherText,
      tip: weatherTip,
    }),
    [weatherText, weatherTip],
  );

  const statsData = useMemo(
    () => [
      {
        title: 'Всего вещей',
        value: dashboardNumbers.clothesNumber,
        icon: Shirt,
        subtitle: 'в гардеробе',
        trend: { value: 5, label: 'за месяц' },
      },
      {
        title: 'Образов',
        value: dashboardNumbers.looksNumber,
        icon: Palette,
        subtitle: 'сохранено',
        trend: { value: 20, label: 'за месяц' },
      },
      { title: 'Носилось', value: dashboardNumbers.wornLast30Days, icon: Eye, subtitle: 'за 30 дней' },
      {
        title: 'Не носилось',
        value: dashboardNumbers.notWornMoreThan30Days,
        icon: TrendingUp,
        subtitle: 'более 60 дней',
        trend: { value: -8, label: 'vs прошлый' },
      },
    ],
    [dashboardNumbers],
  );

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.welcome}>
          <h2 className={styles.welcomeTitle}>Добро пожаловать 👋</h2>
          <p className={styles.welcomeSubtitle}>Вот что происходит с вашим гардеробом сегодня</p>
        </div>

        <div className={styles.statsGrid}>
          {statsData.map((stat) => (
            <StatsCard key={stat.title} {...stat} />
          ))}
        </div>

        <div className={styles.widgetsGrid}>
          <div className={styles.widgetItem}>
            <OutfitOfTheDay outfit={outfitWithWeather} />
          </div>
          <div className={styles.widgetItem}>
            <CalendarPlans
              plans={MOCK_PLANS}
              onAllPlans={navigateToEventsPageHandler}
              onPlanClick={navigateToEventsPageHandler}
            />
          </div>
          <div className={styles.widgetItem}>
            <CategoryBreakdown categories={categories} />
          </div>
        </div>
      </main>
    </div>
  );
}
