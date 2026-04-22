import type { Category, Season } from '@/app/wardrobe/types';

type TFunction = (key: string) => string;

export const getCategoryLabel = (value: Category, t: TFunction): string => {
  const map: Record<Category, string> = {
    headwear: t('wardrobe.sections.headwear'),
    top: t('wardrobe.sections.top'),
    accessory: t('wardrobe.sections.accessory'),
    bags: t('wardrobe.sections.bags'),
    bottom: t('wardrobe.sections.bottom'),
    shoes: t('wardrobe.sections.shoes'),
    other: t('wardrobe.sections.other'),
  };

  return map[value];
};

export const getSeasonLabel = (value: Season, t: TFunction): string => {
  const map: Record<Season, string> = {
    зима: t('wardrobe.seasons.winter'),
    весна: t('wardrobe.seasons.spring'),
    лето: t('wardrobe.seasons.summer'),
    осень: t('wardrobe.seasons.autumn'),
    всесезон: t('wardrobe.seasons.allSeason'),
  };

  return map[value];
};
