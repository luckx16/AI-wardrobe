'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

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


type WeatherByCoordsResponse = {
  temperature: string;
  description: string;
  feels_like: string;
  location?: string;
};


export default function DashboardPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [weatherText, setWeatherText] = useState<string>(t('dashboard.weather.undefined'));
  const [weatherTip, setWeatherTip] = useState<string>(t('dashboard.weather.tipDefault'));

  const statsData = useMemo(
    () => [
      {
        title: t('dashboard.stats.totalItems.title'),
        value: 69,
        icon: Shirt,
        subtitle: t('dashboard.stats.totalItems.subtitle'),
        trend: { value: 5, label: t('dashboard.stats.totalItems.trend') },
      },
      {
        title: t('dashboard.stats.looks.title'),
        value: 12,
        icon: Palette,
        subtitle: t('dashboard.stats.looks.subtitle'),
        trend: { value: 20, label: t('dashboard.stats.looks.trend') },
      },
      { title: t('dashboard.stats.worn.title'), value: 43, icon: Eye, subtitle: t('dashboard.stats.worn.subtitle') },
      {
        title: t('dashboard.stats.notWorn.title'),
        value: 26,
        icon: TrendingUp,
        subtitle: t('dashboard.stats.notWorn.subtitle'),
        trend: { value: -8, label: t('dashboard.stats.notWorn.trend') },
      },
    ],
    [t],
  );

  const navigateToEventsPageHandler = () => {
    router.push(CLIENT_ROUTES.EVENTS);
  };

  useEffect(() => {
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
          setWeatherText(t('dashboard.weather.enterCity'));
          setWeatherTip(t('dashboard.weather.headerHint'));
          return;
        }

        setWeatherText(t('dashboard.weather.loadFailed'));
        setWeatherTip(t('dashboard.weather.tryAgain'));
        return;
      }

      try {
        const weatherLine = `${weatherData.temperature}°C, ${weatherData.description}`;
        setWeatherText(weatherLine);
        setWeatherTip(t('dashboard.weather.feelsLike', { value: weatherData.feels_like }));
      } catch {
        setWeatherText(t('dashboard.weather.loadFailed'));
        setWeatherTip(t('dashboard.weather.tryAgain'));
      }
    };
    void loadWeather();

    const onUserLocationUpdated = () => {
      void loadWeather();
    };

    window.addEventListener(USER_LOCATION_UPDATED_EVENT, onUserLocationUpdated);

    return () => {
      window.removeEventListener(USER_LOCATION_UPDATED_EVENT, onUserLocationUpdated);
    };
  }, [t]);

  const outfitWithWeather = useMemo(
    () => ({
      items: [
        { id: 12, name: t('dashboard.outfit.items.jeans'), category: t('dashboard.categories.items.bottom'), emoji: '👖' },
        { id: 45, name: t('dashboard.outfit.items.hoodie'), category: t('dashboard.categories.items.top'), emoji: '🧥' },
        {
          id: 7,
          name: t('dashboard.outfit.items.trench'),
          category: t('dashboard.categories.items.outerwear'),
          emoji: '🧥',
        },
        { id: 23, name: t('dashboard.outfit.items.sneakers'), category: t('dashboard.categories.items.shoes'), emoji: '👟' },
      ],
      weather: weatherText,
      tip: weatherTip,
    }),
    [t, weatherText, weatherTip],
  );

  const plans = useMemo(
    () => [
      {
        id: 1,
        date: t('dashboard.plans.items.today.date'),
        title: t('dashboard.plans.items.today.title'),
        outfit: t('dashboard.plans.items.today.outfit'),
        color: '#8a6a4a',
      },
      {
        id: 2,
        date: t('dashboard.plans.items.tomorrow.date'),
        title: t('dashboard.plans.items.tomorrow.title'),
        outfit: t('dashboard.plans.items.tomorrow.outfit'),
        color: '#10b981',
      },
      {
        id: 3,
        date: t('dashboard.plans.items.upcomingOne.date'),
        title: t('dashboard.plans.items.upcomingOne.title'),
        outfit: t('dashboard.plans.items.upcomingOne.outfit'),
        color: '#f59e0b',
      },
      {
        id: 4,
        date: t('dashboard.plans.items.upcomingTwo.date'),
        title: t('dashboard.plans.items.upcomingTwo.title'),
        outfit: t('dashboard.plans.items.upcomingTwo.outfit'),
        color: '#f43f5e',
      },
    ],
    [t],
  );

  const categories = useMemo(
    () => [
      { name: t('dashboard.categories.items.top'), count: 24, percentage: 35, emoji: '👕' },
      { name: t('dashboard.categories.items.bottom'), count: 16, percentage: 23, emoji: '👖' },
      { name: t('dashboard.categories.items.shoes'), count: 12, percentage: 17, emoji: '👟' },
      { name: t('dashboard.categories.items.outerwear'), count: 8, percentage: 12, emoji: '🧥' },
      { name: t('dashboard.categories.items.accessories'), count: 9, percentage: 13, emoji: '🎒' },
    ],
    [t],
  );

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.welcome}>
          <h2 className={styles.welcomeTitle}>{t('dashboard.welcomeTitle')} 👋</h2>
          <p className={styles.welcomeSubtitle}>{t('dashboard.welcomeSubtitle')}</p>
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
              plans={plans}
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
