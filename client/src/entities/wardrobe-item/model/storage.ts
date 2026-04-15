import type { ClothingItem } from './types';

export const CUSTOM_ITEMS_STORAGE_KEY = 'ai-wardrobe.custom-items';

export const isCustomItem = (itemId: string) => itemId.startsWith('custom-');

export const readStorageArray = <T,>(storageKey: string): T[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = window.localStorage.getItem(storageKey);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const readCustomItems = () => readStorageArray<ClothingItem>(CUSTOM_ITEMS_STORAGE_KEY);

export const writeCustomItems = (items: ClothingItem[]) => {
  window.localStorage.setItem(CUSTOM_ITEMS_STORAGE_KEY, JSON.stringify(items));
};
