import { type Category, WardrobeItem } from '@/app/wardrobe/types';
import { WARDROBE_API_ROUTES } from '@/shared/constants/wardrobApiRoutes';
import { axiosInstance } from '@/shared/lib/axiosInstance';
import type { ServerResponseType } from '@/shared/types';

const RUSSIAN_TO_CATEGORY: Record<string, Category> = {
  // Верх
  футболка: 'top',
  поло: 'top',
  топ: 'top',
  рубашка: 'top',
  блузка: 'top',
  кофта: 'top',
  платье: 'top',
  сарафан: 'top',
  комбинезон: 'top',
  куртка: 'top',
  пальто: 'top',
  пиджак: 'top',
  тренч: 'top',
  пуховик: 'top',
  ветровка: 'top',
  жилет: 'top',
  свитер: 'top',
  джемпер: 'top',
  кардиган: 'top',
  худи: 'top',
  толстовка: 'top',
  // Низ
  брюки: 'bottom',
  джинсы: 'bottom',
  леггинсы: 'bottom',
  юбка: 'bottom',
  'мини-юбка': 'bottom',
  шорты: 'bottom',
  бермуды: 'bottom',
  // Головные уборы
  шапка: 'headwear',
  кепка: 'headwear',
  шляпа: 'headwear',
  // Аксессуары
  шарф: 'accessory',
  перчатки: 'accessory',
  ремень: 'accessory',
  очки: 'accessory',
  украшения: 'accessory',
  галстук: 'accessory',
  носки: 'accessory',
  // Сумки
  сумка: 'bags',
  рюкзак: 'bags',
  клатч: 'bags',
  шоппер: 'bags',
  // Обувь
  кроссовки: 'shoes',
  кеды: 'shoes',
  ботинки: 'shoes',
  сапоги: 'shoes',
  туфли: 'shoes',
  босоножки: 'shoes',
  балетки: 'shoes',
  слипоны: 'shoes',
  сандалии: 'shoes',
  // Другое
  другое: 'other',
};

function mapCategory(category: string | undefined): Category {
  if (!category) return 'other';
  const normalized = category.toLowerCase();
  return RUSSIAN_TO_CATEGORY[normalized] ?? 'other';
}

type CreateClothRequest = {
  title: string;
  brand?: string;
  material?: string;
  color?: string;
  category?: string;
  season?: string;
};

type CreateClothData = {
  cloth: WardrobeItem;
};

type ClothStatusData = {
  id: number;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  imageUrl: string | null;
};

type UpdateClothRequest = {
  title: string;
  brand?: string;
  material?: string;
  color?: string;
  category?: string;
  season?: string;
};

export async function getAll(): Promise<WardrobeItem[]> {
  const result = await axiosInstance.get<ServerResponseType<WardrobeItem[]>>(
    WARDROBE_API_ROUTES.CLOTHES,
  );
  return result.data.data.map((item) => updateImagePath(item));
}

export async function getById(id: string): Promise<WardrobeItem> {
  const result = await axiosInstance.get<ServerResponseType<WardrobeItem>>(
    WARDROBE_API_ROUTES.CLOTH(id),
  );
  return updateImagePath(result.data.data);
}

export async function createClothesItem(
  input: CreateClothRequest,
  image: File,
): Promise<WardrobeItem> {
  const formData = new FormData();
  formData.append('image', image);
  formData.append('title', input.title);
  if (input.brand) formData.append('brand', input.brand);
  if (input.material) formData.append('material', input.material);
  if (input.color) formData.append('color', input.color);
  if (input.category) formData.append('category', input.category);
  if (input.season) formData.append('season', input.season);
  const { data } = await axiosInstance.post<ServerResponseType<CreateClothData>>(
    WARDROBE_API_ROUTES.CLOTHES,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );

  return updateImagePath(data.data.cloth);
}

const CATEGORY_TO_RUSSIAN: Record<Category, string> = {
  headwear: 'шапка',
  top: 'футболка',
  accessory: 'шарф',
  bags: 'сумка',
  bottom: 'брюки',
  shoes: 'кроссовки',
  other: 'другое',
};

function mapCategoryToRussian(category: Category): string {
  return CATEGORY_TO_RUSSIAN[category] ?? 'другое';
}

export async function updateClothesItem(
  id: string,
  data: UpdateClothRequest,
): Promise<WardrobeItem> {
  const result = await axiosInstance.put<ServerResponseType<WardrobeItem>>(
    WARDROBE_API_ROUTES.CLOTH(id),
    {
      ...data,
      category: data.category ? mapCategoryToRussian(data.category as Category) : undefined,
    },
  );
  return updateImagePath(result.data.data);
}

export async function removeClothesItem(id: string): Promise<void> {
  await axiosInstance.delete<ServerResponseType<void>>(WARDROBE_API_ROUTES.CLOTH(id));
}

export async function getClothProcessingStatus(id: string): Promise<ClothStatusData> {
  const result = await axiosInstance.get<ServerResponseType<ClothStatusData>>(
    WARDROBE_API_ROUTES.CLOTH_STATUS(id),
  );
  return result.data.data;
}

function updateImagePath(item: WardrobeItem): WardrobeItem {
  return {
    ...item,
    image: `http://localhost:4000/uploads/processed/${item.image}`,
    category: mapCategory(item.category),
  };
}
