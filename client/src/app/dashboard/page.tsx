'use client';

import { useEffect, useMemo, useState } from 'react';

import clsx from 'clsx';
import { Eye, Palette, Shirt, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  DashboardNumbersResponse,
  DashboardSectionsResponse,
  loadDashboardNumbersApi,
  loadDashboardSectionsApi,
} from '@/entities/dashboard';
import { EVENT_MODAL_CONSTANTS, IEvent } from '@/entities/events';
import { getAllEventsThunk } from '@/entities/events/api/eventsThunk';
import { fetchWeatherApi } from '@/entities/weather';
import { CLIENT_ROUTES } from '@/shared/constants/clientRoutes';
import { useAppDispatch, useAppSelector } from '@/shared/hooks';
import { useCustomRouter } from '@/shared/hooks/useCustomRouter';
import { USER_LOCATION_UPDATED_EVENT, userLocationStorage } from '@/shared/lib/userLocation';
import { StatsCard } from '@/shared/ui';
import { CalendarPlans, OutfitOfTheDay } from '@/widgets';
import { CategoryBreakdown } from '@/widgets/CategoryBreakdown';

import styles from './dashboard.module.css';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { router, addQueryParams } = useCustomRouter();
  const [weatherText, setWeatherText] = useState<string>(t('dashboard.weather.undefined'));
  const [weatherTip, setWeatherTip] = useState<string>(t('dashboard.weather.tipDefault'));

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
  const navigateToEventEditingEventsPageHandler = (event: IEvent) => {
    const { id, title, date, activity_type, look_id } = event;
    addQueryParams(
      {
        title,
        date: date.slice(0, 10),
        activity_type,
        look_id,
        [EVENT_MODAL_CONSTANTS.IS_OPEN]: 'true',
        [EVENT_MODAL_CONSTANTS.IN_EDIT_MODE_EVENT_ID]: id,
      },
      CLIENT_ROUTES.EVENTS,
    );
  };
  const navigateToEventsWithCreateModal = () => {
    addQueryParams(
      {
        [EVENT_MODAL_CONSTANTS.IS_OPEN]: 'true',
      },
      CLIENT_ROUTES.EVENTS,
    );
  };

  useEffect(() => {
    const loadWeatherData = async () => {
      const coords = userLocationStorage.getCoords();
      const city = userLocationStorage.getCity();

      if (!coords && !city) {
        setWeatherText(t('dashboard.weather.enterCity'));
        setWeatherTip(t('dashboard.weather.headerHint'));
        return;
      }

      const weatherData = await fetchWeatherApi(coords ?? city ?? undefined);

      if (!weatherData) {
        setWeatherText(t('dashboard.weather.loadFailed'));
        setWeatherTip(t('dashboard.weather.tryAgain'));
        return;
      }

      const weatherLine = `${weatherData.temperature}°C, ${weatherData.description}`;
      setWeatherText(weatherLine);
      setWeatherTip(t('dashboard.weather.feelsLike', { value: weatherData.feels_like }));
    };

    const loadDashboardData = async () => {
      const [dashboardNumbers, dashboardSections] = await Promise.all([
        loadDashboardNumbersApi(),
        loadDashboardSectionsApi(),
      ]);

      if (dashboardNumbers) {
        setDashboardNumbers(dashboardNumbers);
      }
      if (dashboardSections) {
        setCategories(dashboardSections);
      }
    };

    loadWeatherData();
    loadDashboardData();

    const onUserLocationUpdated = () => {
      loadWeatherData();
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

  const { events } = useAppSelector((s) => s.events);
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(getAllEventsThunk());
  }, [dispatch]);

  console.log('events', events);

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
      <div className={styles.welcome}>
        <h1 className={clsx('pageTitle')}>{t('dashboard.welcomeTitle')} 👋</h1>
        <p className={clsx('pageSubtitle')}>{t('dashboard.welcomeSubtitle')}</p>
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
            plans={events}
            onAllPlans={navigateToEventsPageHandler}
            onCreatePlan={navigateToEventsWithCreateModal}
            onPlanClick={navigateToEventEditingEventsPageHandler}
          />
        </div>
        <div className={styles.widgetItem}>
          <CategoryBreakdown categories={categories} />
        </div>
      </div>
    </div>
  );
}
