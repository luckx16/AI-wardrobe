export type ClothingCategory = 'top' | 'bottom' | 'shoes';

export type ClothingItem = {
  id: string;
  name: string;
  category: ClothingCategory;
  color: string;
  description: string;
  icon: string;
  imageUrl?: string;
};
