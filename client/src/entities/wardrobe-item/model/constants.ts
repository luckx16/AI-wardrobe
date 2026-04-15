import type { ClothingCategory, ClothingItem } from './types';

export const BASE_ITEMS: ClothingItem[] = [
  {
    id: 'item-top-1',
    name: 'Oversized Hoodie',
    category: 'top',
    color: '#d8c7b6',
    description: 'Тёплый верх для повседневного образа.',
    icon: '🧥',
  },
  {
    id: 'item-top-2',
    name: 'Minimal Shirt',
    category: 'top',
    color: '#dadada',
    description: 'Базовая рубашка в чистом стиле.',
    icon: '👕',
  },
  {
    id: 'item-bottom-1',
    name: 'Straight Jeans',
    category: 'bottom',
    color: '#8ca2b3',
    description: 'Джинсы прямого кроя.',
    icon: '👖',
  },
  {
    id: 'item-bottom-2',
    name: 'Tailored Pants',
    category: 'bottom',
    color: '#8f877f',
    description: 'Брюки для более строгого образа.',
    icon: '🩳',
  },
  {
    id: 'item-shoes-1',
    name: 'Clean Sneakers',
    category: 'shoes',
    color: '#efefef',
    description: 'Лаконичные кеды.',
    icon: '👟',
  },
  {
    id: 'item-shoes-2',
    name: 'Leather Boots',
    category: 'shoes',
    color: '#5a4b3e',
    description: 'Ботинки с выразительной фактурой.',
    icon: '🥾',
  },
];

export const CATEGORY_LABELS: Record<ClothingCategory, string> = {
  top: 'Верх',
  bottom: 'Низ',
  shoes: 'Обувь',
};

export const SLOT_ORDER: ClothingCategory[] = ['top', 'bottom', 'shoes'];
export const FILTER_ORDER: Array<'all' | ClothingCategory> = ['all', 'top', 'bottom', 'shoes'];

export const MAX_UPLOAD_SIZE_BYTES = 8 * 1024 * 1024;
