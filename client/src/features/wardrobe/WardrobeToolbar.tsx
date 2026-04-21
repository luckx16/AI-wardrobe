import type { Category, Season } from '../../app/wardrobe/types';
import { getCategoryLabel, getSeasonLabel } from '@/shared/lib/wardrobeI18n';
import { useTranslation } from 'react-i18next';
import styles from './WardrobeToolbar.module.css';

type SortField = 'title' | 'season' | 'createdAt' | 'category';

interface WardrobeToolbarProps {
  sortBy: SortField;
  onSortChange: (field: SortField) => void;
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

const sortOptions: { value: SortField }[] = [
  { value: 'title' },
  { value: 'season' },
  { value: 'category' },
  { value: 'createdAt' },
];

const cx = (...classNames: Array<string | false | null | undefined>) =>
  classNames.filter(Boolean).join(' ');

const WardrobeToolbar = ({
  sortBy,
  onSortChange,
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
          <h1 className={styles.title}>{t('wardrobe.title')}</h1>
          <p className={styles.count}>
            {t('wardrobe.itemsCount', { count: totalCount })}
          </p>
        </div>
        {addButton}
      </div>

      <div className={styles.controls}>
        <div className={styles.group}>
          <span className={styles.label}>{t('wardrobe.sort.label')}</span>
          <div className={styles.sortList}>
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onSortChange(opt.value)}
                type="button"
                className={cx(styles.sortButton, sortBy === opt.value && styles.sortButtonActive)}
              >
                {t(`wardrobe.sort.${opt.value}`)}
              </button>
            ))}
          </div>
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
