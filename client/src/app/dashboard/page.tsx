'use client';

import { useRouter } from 'next/navigation';

import { Eye, Palette, Shirt, TrendingUp } from 'lucide-react';

import { CLIENT_ROUTES } from '@/shared/constants/clientRoutes';
import { StatsCard } from '@/shared/ui';
import { CalendarPlans, OutfitOfTheDay } from '@/widgets';
import { CategoryBreakdown } from '@/widgets/CategoryBreakdown';

import styles from './dashboard.module.css';

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

const MOCK_OUTFIT = {
  weather: '+15°C, облачно, дождь',
  items: [
    { id: 12, name: 'Синие джинсы', category: 'Низ', emoji: '👖' },
    { id: 45, name: 'Белая худи', category: 'Верх', emoji: '🧥' },
    { id: 7, name: 'Бежевый тренч', category: 'Верхняя одежда', emoji: '🧥' },
    { id: 23, name: 'Белые кроссовки', category: 'Обувь', emoji: '👟' },
  ],
  tip: 'Возьмите зонт — после обеда возможен дождь ☂️',
};

const MOCK_PLANS = [
  { id: 1, date: 'Сегодня', title: 'Деловая встреча', outfit: 'Офисный стиль', color: '#8a6a4a' },
  { id: 2, date: 'Завтра', title: 'Ужин с друзьями', outfit: 'Casual вечерний', color: '#10b981' },
  { id: 3, date: 'Ср, 16 апр', title: 'Презентация', outfit: 'Формальный', color: '#f59e0b' },
  { id: 4, date: 'Пт, 18 апр', title: 'Прогулка', outfit: 'Спортивный', color: '#f43f5e' },
];

const MOCK_CATEGORIES = [
  { name: 'Верх', count: 24, percentage: 35, emoji: '👕' },
  { name: 'Низ', count: 16, percentage: 23, emoji: '👖' },
  { name: 'Обувь', count: 12, percentage: 17, emoji: '👟' },
  { name: 'Верхняя одежда', count: 8, percentage: 12, emoji: '🧥' },
  { name: 'Аксессуары', count: 9, percentage: 13, emoji: '🎒' },
];

export default function DashboardPage() {
  const router = useRouter();

  const navigateToEventsPageHandler = () => {
    router.push(CLIENT_ROUTES.EVENTS);
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.welcome}>
          <h2 className={styles.welcomeTitle}>Добро пожаловать 👋</h2>
          <p className={styles.welcomeSubtitle}>Вот что происходит с вашим гардеробом сегодня</p>
        </div>

        <div className={styles.statsGrid}>
          {MOCK_STATS_DATA.map((stat) => (
            <StatsCard key={stat.title} {...stat} />
          ))}
        </div>

        <div className={styles.widgetsGrid}>
          <div className={styles.widgetItem}>
            <OutfitOfTheDay outfit={MOCK_OUTFIT} />
          </div>
          <div className={styles.widgetItem}>
            <CalendarPlans
              plans={MOCK_PLANS}
              onAllPlans={navigateToEventsPageHandler}
              onPlanClick={navigateToEventsPageHandler}
            />
          </div>
          <div className={styles.widgetItem}>
            <CategoryBreakdown categories={MOCK_CATEGORIES} />
          </div>
        </div>
      </main>
    </div>
  );
}
