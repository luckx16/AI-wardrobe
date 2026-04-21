import type { Category, Season } from '@/app/wardrobe/types';

type TFunction = (key: string) => string;

export const getCategoryLabel = (value: Category, t: TFunction): string => {
  const map: Record<Category, string> = {
    футболка: t('wardrobe.categories.tshirt'),
    рубашка: t('wardrobe.categories.shirt'),
    платье: t('wardrobe.categories.dress'),
    брюки: t('wardrobe.categories.pants'),
    юбка: t('wardrobe.categories.skirt'),
    куртка: t('wardrobe.categories.jacket'),
    свитер: t('wardrobe.categories.sweater'),
    худи: t('wardrobe.categories.hoodie'),
    шорты: t('wardrobe.categories.shorts'),
    обувь: t('wardrobe.categories.shoes'),
    аксессуары: t('wardrobe.categories.accessories'),
    другое: t('wardrobe.categories.other'),
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
