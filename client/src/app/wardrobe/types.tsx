export type Season = 'зима' | 'весна' | 'лето' | 'осень' | 'всесезон';
export type Category =
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

export interface WardrobeItem {
  id: string;
  title: string;
  brand?: string | null;
  material?: string | null;
  category: Category;
  season: Season;
  color: string;
  image: string;
  createdAt: string;
}
