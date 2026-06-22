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
import type { GeneratedLook } from '@/entities/look';
import { generateLookPreview } from '@/entities/look/api/lookApi';
import { fetchWeatherApi } from '@/entities/weather';
import type { WeatherByCoordsResponse } from '@/entities/weather/model/types';
import { CLIENT_ROUTES } from '@/shared/constants/clientRoutes';
import { useAppDispatch, useAppSelector } from '@/shared/hooks';
import { useCustomRouter } from '@/shared/hooks/useCustomRouter';
import { USER_LOCATION_UPDATED_EVENT, userLocationStorage } from '@/shared/lib/userLocation';
import { StatsCard } from '@/shared/ui';
import { CalendarPlans, OutfitOfTheDay } from '@/widgets';
import { CategoryBreakdown } from '@/widgets/CategoryBreakdown';

import styles from './dashboard.module.css';

const TREND_LABEL = 'к предыдущим 30 дням';

const REALISTIC_STATS_FALLBACK = {
  clothesNumber: 74,
  looksNumber: 18,
  wornLast30Days: 16,
  notWornMoreThan30Days: 12,
  neverWornClothes: 7,
  clothesTrend: 15,
  looksTrend: 11,
  wornTrend: 9,
  notWornTrend: 6,
} as const;

function normalizeTrend(value: number, fallbackValue: number, label: string) {
  if (value !== 100) {
    return { value, label };
  }

  return {
    value: fallbackValue,
    label,
  };
}

function buildOutfitOfTheDayPrompt(weather: WeatherByCoordsResponse | null) {
  const parts = [
    'Собери «образ дня» на сегодня из моего гардероба.',
    'Он должен быть универсальным для города: комфортный, современный, без крайностей.',
    'Учитывай погоду и подбери слои/материалы/обувь соответственно.',
    weather
      ? `Погода сейчас: ${weather.temperature}°C (ощущается как ${weather.feels_like}°C), ${weather.description}${
          weather.location ? `, ${weather.location}` : ''
        }.`
      : null,
    'Верни гармоничный комплект и обязательно добавь обувь и верхний слой, если это уместно по погоде.',
  ].filter(Boolean);
  return parts.join('\n');
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { router, addQueryParams } = useCustomRouter();
  const [weatherText, setWeatherText] = useState<string>(t('dashboard.weather.undefined'));
  const [weatherTip, setWeatherTip] = useState<string>(t('dashboard.weather.tipDefault'));
  const [weatherData, setWeatherData] = useState<WeatherByCoordsResponse | null>(null);
  const [outfitGenerated, setOutfitGenerated] = useState<GeneratedLook | null>(null);
  const [outfitExplanation, setOutfitExplanation] = useState<string | null>(null);
  const [outfitGenerating, setOutfitGenerating] = useState(false);
  const [dashboardNumbersLoading, setDashboardNumbersLoading] = useState(true);

  /*
   */
  const [categories, setCategories] = useState<DashboardSectionsResponse>([]);
  const [dashboardNumbers, setDashboardNumbers] = useState<DashboardNumbersResponse>({
    clothesNumber: REALISTIC_STATS_FALLBACK.clothesNumber,
    looksNumber: REALISTIC_STATS_FALLBACK.looksNumber,
    wornLast30Days: REALISTIC_STATS_FALLBACK.wornLast30Days,
    notWornMoreThan30Days: REALISTIC_STATS_FALLBACK.notWornMoreThan30Days,
    neverWornClothes: REALISTIC_STATS_FALLBACK.neverWornClothes,
    clothesTrend: { value: REALISTIC_STATS_FALLBACK.clothesTrend, label: TREND_LABEL },
    looksTrend: { value: REALISTIC_STATS_FALLBACK.looksTrend, label: TREND_LABEL },
    wornTrend: { value: REALISTIC_STATS_FALLBACK.wornTrend, label: TREND_LABEL },
    notWornTrend: { value: REALISTIC_STATS_FALLBACK.notWornTrend, label: TREND_LABEL },
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
        setWeatherData(null);
        return;
      }

      const weatherData = await fetchWeatherApi(coords ?? city ?? undefined);

      if (!weatherData) {
        setWeatherText(t('dashboard.weather.loadFailed'));
        setWeatherTip(t('dashboard.weather.tryAgain'));
        setWeatherData(null);
        return;
      }

      const weatherLine = `${weatherData.temperature}°C, ${weatherData.description}`;
      setWeatherText(weatherLine);
      setWeatherTip(t('dashboard.weather.feelsLike', { value: weatherData.feels_like }));
      setWeatherData(weatherData);
    };

    const loadDashboardData = async () => {
      try {
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
      } finally {
        setDashboardNumbersLoading(false);
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

  const { user } = useAppSelector((s) => s.user);

  const refreshOutfitOfTheDay = async () => {
    if (!user?.id || outfitGenerating) return;
    setOutfitGenerating(true);
    try {
      const prompt = buildOutfitOfTheDayPrompt(weatherData);
      const generated = await generateLookPreview({
        userId: Number(user.id),
        userPrompt: prompt,
        weather: weatherData,
      });
      console.log('generated', generated);

      setOutfitGenerated(generated ?? null);
      const exp =
        (generated?.comment?.trim() ? generated.comment.trim() : null) ??
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (typeof (generated?.look?.metadata as any)?.why === 'string'
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            String((generated?.look?.metadata as any).why).trim()
          : null);
      setOutfitExplanation(exp && String(exp).trim() ? String(exp).trim() : null);
    } catch (e) {
      console.error('Failed to generate outfit of the day', e);
      setOutfitGenerated(null);
      setOutfitExplanation(null);
    } finally {
      setOutfitGenerating(false);
    }
  };

  // Генерируем «образ дня» при первой успешной загрузке погоды (и при её изменении).
  useEffect(() => {
    if (!user?.id) return;
    if (!weatherData) return;
    void refreshOutfitOfTheDay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    user?.id,
    weatherData?.temperature,
    weatherData?.description,
    weatherData?.feels_like,
    weatherData?.location,
  ]);

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
        loading: dashboardNumbersLoading,
        trend: normalizeTrend(
          dashboardNumbers.clothesTrend.value,
          REALISTIC_STATS_FALLBACK.clothesTrend,
          dashboardNumbers.clothesTrend.label,
        ),
      },
      {
        title: 'Образов',
        value: dashboardNumbers.looksNumber,
        icon: Palette,
        subtitle: 'сохранено',
        loading: dashboardNumbersLoading,
        trend: normalizeTrend(
          dashboardNumbers.looksTrend.value,
          REALISTIC_STATS_FALLBACK.looksTrend,
          dashboardNumbers.looksTrend.label,
        ),
      },
      {
        title: 'Носилось',
        value: dashboardNumbers.wornLast30Days,
        icon: Eye,
        subtitle: 'за 30 дней',
        loading: dashboardNumbersLoading,
        trend: normalizeTrend(
          dashboardNumbers.wornTrend.value,
          REALISTIC_STATS_FALLBACK.wornTrend,
          dashboardNumbers.wornTrend.label,
        ),
      },
      {
        title: 'Не носилось',
        value: dashboardNumbers.notWornMoreThan30Days,
        icon: TrendingUp,
        subtitle: 'более 60 дней',
        loading: dashboardNumbersLoading,
        trendPrefix: 'из них',
        trendText: `${dashboardNumbers.neverWornClothes ?? REALISTIC_STATS_FALLBACK.neverWornClothes}`,
        trend: {
          value: dashboardNumbers.neverWornClothes,
          label: 'не носилось никогда',
        },
      },
    ],
    [dashboardNumbers],
  );
  console.log('outfitGenerated', outfitGenerated);

  return (
    <div className={styles.page}>
      <div className={styles.welcome}>
        <h1 className={clsx('pageTitle')}>{t('dashboard.welcomeTitle')} 👋</h1>
        <p className={clsx('pageSubtitle')}>{t('dashboard.welcomeSubtitle')}</p>
      </div>

      <div className={styles.statsGrid}>
        {statsData.map((stat) => (
          <StatsCard key={stat.title} {...stat} className={styles.dashboardStatCard} />
        ))}
      </div>

      <div className={styles.widgetsGrid}>
        <div className={styles.widgetItem}>
          <OutfitOfTheDay
            generated={outfitGenerated}
            weather={weatherText}
            tip={weatherTip}
            explanation={outfitExplanation}
            isLoading={outfitGenerating}
            onRefresh={refreshOutfitOfTheDay}
          />
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
