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
  id: number;
  title: string;
  category: Category;
  season: Season;
  color: string;
  image: string;
  dateAdded: string;
}
