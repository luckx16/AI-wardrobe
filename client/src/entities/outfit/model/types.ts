export type OutfitSlots = {
  top: string | null;
  bottom: string | null;
  shoes: string | null;
};

export type SavedOutfit = {
  id: string;
  name: string;
  itemIds: string[];
  createdAt: string;
};
