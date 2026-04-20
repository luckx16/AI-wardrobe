import { readStorageArray } from '@/entities/wardrobe-item/model/storage';

import type { SavedOutfit } from './types';

export const OUTFIT_STORAGE_KEY = 'ai-wardrobe.saved-outfits';

export const readSavedOutfits = () => readStorageArray<SavedOutfit>(OUTFIT_STORAGE_KEY);

export const writeSavedOutfits = (outfits: SavedOutfit[]) => {
  window.localStorage.setItem(OUTFIT_STORAGE_KEY, JSON.stringify(outfits));
};
