export type Season = 'зима' | 'весна' | 'лето' | 'осень' | 'всесезон';
export type Category =
  | 'headwear'  // Головные уборы
  | 'top'       // Верх
  | 'accessory' // Аксессуары
  | 'bags'      // Сумки
  | 'bottom'    // Низ
  | 'shoes'     // Обувь
  | 'other';    // Другое

export interface WardrobeItem {
  id: string;
  title: string;
  brand?: string | null;
  material?: string | null;
  category: Category;
  season: Season;
  color: string;
  image: string;
  processing_status?: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
}
