export type Season = "Зима" | "Весна" | "Лето" | "Осень" | "Все сезоны";
export type Category = "Верхняя одежда" | "Футболки" | "Брюки" | "Свитеры" | "Обувь" | "Рубашки";

export interface WardrobeItem {
  id: string;
  name: string;
  category: Category;
  season: Season;
  color: string;
  image: string;
  dateAdded: string;
}

export const wardrobeItems: WardrobeItem[] = [
  {
    id: "1",
    name: "Шерстяное пальто",
    category: "Верхняя одежда",
    season: "Зима",
    color: "Тёмно-синий",
    image: "/coat.jpg",
    dateAdded: "2024-11-15",
  },
  {
    id: "2",
    name: "Базовая футболка",
    category: "Футболки",
    season: "Лето",
    color: "Белый",
    image: "/tshirt.jpg",
    dateAdded: "2025-03-01",
  },
  {
    id: "3",
    name: "Классические джинсы",
    category: "Брюки",
    season: "Все сезоны",
    color: "Синий",
    image: "/jeans.jpg",
    dateAdded: "2025-01-20",
  },
  {
    id: "4",
    name: "Вязаный свитер",
    category: "Свитеры",
    season: "Осень",
    color: "Бежевый",
    image: "/sweater.jpg",
    dateAdded: "2024-10-05",
  },
  {
    id: "5",
    name: "Кожаные кеды",
    category: "Обувь",
    season: "Все сезоны",
    color: "Чёрный",
    image: "/sneakers.jpg",
    dateAdded: "2025-02-14",
  },
  {
    id: "6",
    name: "Оксфорд рубашка",
    category: "Рубашки",
    season: "Весна",
    color: "Голубой",
    image: "/shirt.jpg",
    dateAdded: "2025-04-01",
  },
  {
    id: "7",
    name: "Ветровка",
    category: "Верхняя одежда",
    season: "Весна",
    color: "Зелёный",
    image: "/jacket.jpg",
    dateAdded: "2025-03-20",
  },
];
