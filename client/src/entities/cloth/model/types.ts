export type ClothingSection =
  | 'headwear'
  | 'top'
  | 'accessory'
  | 'bags'
  | 'bottom'
  | 'shoes'
  | 'other';

export interface IClothFromDb {
  id: string;
  title: string;
  user_id: string;
  brand: string;
  material: string;
  color: string;
  category:
    | 'футболка'
    | 'рубашка'
    | 'платье'
    | 'брюки'
    | 'юбка'
    | 'куртка'
    | 'свитер'
    | 'худи'
    | 'шорты'
    | 'обувь'
    | 'аксессуары'
    | 'другое';
  section: ClothingSection;
  season: 'лето' | 'зима' | 'весна' | 'осень' | 'всесезон';
  image: string;
  worn_at: null;
  ai_metadata: {
    confidence: number;
    processed_at: string;
    detected_color: string;
    detected_material: string;
    description?: string;
  };
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}
