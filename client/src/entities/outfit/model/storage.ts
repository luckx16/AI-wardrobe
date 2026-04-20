import type { SavedOutfit } from './types';

const readStorageArray = <T>(key: string): T[] => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const OUTFIT_STORAGE_KEY = 'ai-wardrobe.saved-outfits';

export const readSavedOutfits = () => readStorageArray<SavedOutfit>(OUTFIT_STORAGE_KEY);

export const writeSavedOutfits = (outfits: SavedOutfit[]) => {
  window.localStorage.setItem(OUTFIT_STORAGE_KEY, JSON.stringify(outfits));
};
