import type { Category, Season } from '@/app/wardrobe/types';

type TFunction = (key: string) => string;

const CATEGORY_LABELS: Record<Category, string> = {
  headwear: 'Головные уборы',
  top: 'Верх',
  accessory: 'Аксессуары',
  bags: 'Сумки',
  bottom: 'Низ',
  shoes: 'Обувь',
  other: 'Другое',
};

const SEASON_LABELS: Record<Season, string> = {
  зима: 'Зима',
  весна: 'Весна',
  лето: 'Лето',
  осень: 'Осень',
  всесезон: 'Всесезон',
};

export const getCategoryLabel = (value: Category, t: TFunction): string => {
  const translated = t('wardrobe.sections.' + value);
  // Если i18n не инициализирован, возвращает ключ - используем дефолт
  if (translated === 'wardrobe.sections.' + value) {
    return CATEGORY_LABELS[value] ?? 'Другое';
  }
  return translated;
};

export const getSeasonLabel = (value: Season, t: TFunction): string => {
  const translated = t(
    'wardrobe.seasons.' +
      (value === 'всесезон'
        ? 'allSeason'
        : value === 'зима'
          ? 'winter'
          : value === 'весна'
            ? 'spring'
            : value === 'лето'
              ? 'summer'
              : 'autumn'),
  );
  // Если i18n не инициализирован, возвращает ключ - используем дефолт
  if (translated.startsWith('wardrobe.seasons.')) {
    return SEASON_LABELS[value] ?? value;
  }
  return translated;
};
