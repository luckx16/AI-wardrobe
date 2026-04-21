import { WardrobeItem } from '@/app/wardrobe/types';
import { WARDROBE_API_ROUTES } from '@/shared/constants/wardrobApiRoutes';
import { axiosInstance } from '@/shared/lib/axiosInstance';
import type { ServerResponseType } from '@/shared/types';

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

export async function updateClothesItem(id: string, data: WardrobeItem): Promise<WardrobeItem> {
  const result = await axiosInstance.put<ServerResponseType<WardrobeItem>>(
    WARDROBE_API_ROUTES.CLOTH(id),
    data,
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
  return { ...item, image: `http://localhost:4000/uploads/processed/${item.image}` };
}
