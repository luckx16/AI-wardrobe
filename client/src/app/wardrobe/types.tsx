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
  id: number;
  title: string;
  category: Category;
  season: Season;
  color: string;
  image: string;
  processing_status?: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
}
