'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { Eye, Palette, Shirt, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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

  type DashboardNumbersResponse = {
    clothesNumber: number;
    looksNumber: number;
    wornLast30Days: number;
    notWornMoreThan30Days: number;
    clothesTrend: {
      value: number;
      label: string;
    };
    looksTrend: {
      value: number;
      label: string;
    };
    wornTrend: {
      value: number;
      label: string;
    };
    notWornTrend: {
      value: number;
      label: string;
    };
  };

  type DashboardSectionsResponse = {
    name: string;
    emoji: string;
    count: number;
    percentage: number;
  }[];

  /*
   */
  const [categories, setCategories] = useState<DashboardSectionsResponse>([]);
  const [dashboardNumbers, setDashboardNumbers] = useState<DashboardNumbersResponse>({
    clothesNumber: 0,
    looksNumber: 0,
    wornLast30Days: 0,
    notWornMoreThan30Days: 0,
    clothesTrend: { value: 0, label: 'к предыдущим 30 дням' },
    looksTrend: { value: 0, label: 'к предыдущим 30 дням' },
    wornTrend: { value: 0, label: 'к предыдущим 30 дням' },
    notWornTrend: { value: 0, label: 'к предыдущим 30 дням' },
  });
  const navigateToEventsPageHandler = () => {
    router.push(CLIENT_ROUTES.EVENTS);
  };

  useEffect(() => {
    const loadDashboardNumbers = async () => {
      try {
        const { data } =
          await axiosInstance.get<ServerResponseType<DashboardNumbersResponse>>(
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
        const { data } =
          await axiosInstance.get<ServerResponseType<DashboardSectionsResponse>>(
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
    void loadDashboardNumbers();
    void loadDashboardSections();

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
        {
          id: 12,
          name: t('dashboard.outfit.items.jeans'),
          category: t('dashboard.categories.items.bottom'),
          emoji: '👖',
        },
        {
          id: 45,
          name: t('dashboard.outfit.items.hoodie'),
          category: t('dashboard.categories.items.top'),
          emoji: '🧥',
        },
        {
          id: 7,
          name: t('dashboard.outfit.items.trench'),
          category: t('dashboard.categories.items.outerwear'),
          emoji: '🧥',
        },
        {
          id: 23,
          name: t('dashboard.outfit.items.sneakers'),
          category: t('dashboard.categories.items.shoes'),
          emoji: '👟',
        },
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

  const statsData = useMemo(
    () => [
      {
        title: 'Всего вещей',
        value: dashboardNumbers.clothesNumber,
        icon: Shirt,
        subtitle: 'в гардеробе',
        trend: dashboardNumbers.clothesTrend,
      },
      {
        title: 'Образов',
        value: dashboardNumbers.looksNumber,
        icon: Palette,
        subtitle: 'сохранено',
        trend: dashboardNumbers.looksTrend,
      },
      {
        title: 'Носилось',
        value: dashboardNumbers.wornLast30Days,
        icon: Eye,
        subtitle: 'за 30 дней',
        trend: dashboardNumbers.wornTrend,
      },
      {
        title: 'Не носилось',
        value: dashboardNumbers.notWornMoreThan30Days,
        icon: TrendingUp,
        subtitle: 'более 60 дней',
        trend: dashboardNumbers.notWornTrend,
      },
    ],
    [dashboardNumbers],
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
