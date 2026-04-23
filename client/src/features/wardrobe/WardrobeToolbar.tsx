import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

import { getSeasonLabel } from '@/shared/lib/wardrobeI18n';

import type { Category, Season } from '../../app/wardrobe/types';
import styles from './WardrobeToolbar.module.css';

type SortField = 'createdAt';
type SortDirection = 'asc' | 'desc';

interface WardrobeToolbarProps {
  sortDirection: SortDirection;
  onSortDirectionChange: (direction: SortDirection) => void;
  filterSeason: Season | 'all';
  onFilterSeasonChange: (season: Season | 'all') => void;
  filterCategory: Category | 'all';
  onFilterCategoryChange: (cat: Category | 'all') => void;
  totalCount: number;
  addButton?: React.ReactNode;
}

const seasons: (Season | 'all')[] = ['all', 'зима', 'весна', 'лето', 'осень', 'всесезон'];
const categoryOptions: Array<{ value: Category | 'all'; label: string }> = [
  { value: 'all', label: 'Все' },
  { value: 'headwear', label: 'Головные уборы' },
  { value: 'top', label: 'Верх' },
  { value: 'accessory', label: 'Аксессуары' },
  { value: 'bags', label: 'Сумки' },
  { value: 'bottom', label: 'Низ' },
  { value: 'shoes', label: 'Обувь' },
  { value: 'other', label: 'Другое' },
];

const sortOptions: { value: SortField }[] = [{ value: 'createdAt' }];

const cx = (...classNames: Array<string | false | null | undefined>) =>
  classNames.filter(Boolean).join(' ');

const WardrobeToolbar = ({
  sortDirection,
  onSortDirectionChange,
  filterSeason,
  onFilterSeasonChange,
  filterCategory,
  onFilterCategoryChange,
  totalCount,
  addButton,
}: WardrobeToolbarProps) => {
  const { t } = useTranslation();

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <h1 className={clsx('pageTitle')}>{t('wardrobe.title')}</h1>
          <p className={clsx('pageSubtitle')}>{t('wardrobe.itemsCount', { count: totalCount })}</p>
        </div>
        {addButton}
      </div>

      <div className={styles.controls}>
        <div className={styles.group}>
          <span className={styles.label}>{t('wardrobe.sort.label')}</span>
          <select
            value={sortDirection}
            onChange={(e) => onSortDirectionChange(e.target.value as SortDirection)}
            className={styles.select}
          >
            <option value="desc">Новые</option>
            <option value="asc">Старые</option>
          </select>
        </div>

        <div className={styles.divider} />

        <div className={styles.group}>
          <span className={styles.label}>{t('wardrobe.season')}</span>
          <select
            value={filterSeason}
            onChange={(e) => onFilterSeasonChange(e.target.value as Season | 'all')}
            className={styles.select}
          >
            {seasons.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? t('wardrobe.all') : getSeasonLabel(s, t)}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.group}>
          <span className={styles.label}>{t('wardrobe.category')}</span>
          <select
            value={filterCategory}
            onChange={(e) => onFilterCategoryChange(e.target.value as Category | 'all')}
            className={styles.select}
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default WardrobeToolbar;
