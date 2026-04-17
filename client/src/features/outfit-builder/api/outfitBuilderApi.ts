import { axiosInstance } from '@/shared/lib/axiosInstance';
import { resolveAssetUrl } from '@/shared/lib/uploadApi';
import type { ClothingItem } from '@/entities/wardrobe-item/model/types';

export type ServerCloth = {
  id: string;
  title: string;
  color: string | null;
  category: string | null;
  image: string | null;
  ai_metadata?: {
    description?: string | null;
  } | null;
  createdAt?: string;
};

export type ServerLook = {
  id: string;
  title: string;
  cloth_ids: string[];
  createdAt: string;
};

const CATEGORY_MAP: Record<string, 'top' | 'bottom' | 'shoes'> = {
  футболка: 'top',
  рубашка: 'top',
  платье: 'top',
  куртка: 'top',
  свитер: 'top',
  худи: 'top',
  брюки: 'bottom',
  юбка: 'bottom',
  шорты: 'bottom',
  обувь: 'shoes',
};

type ApiEnvelope<T> = {
  data: T;
};

export async function getCloths() {
  const response = await axiosInstance.get<ApiEnvelope<ServerCloth[]>>('/cloth');
  return response.data.data;
}

export async function getLooks() {
  const response = await axiosInstance.get<ServerLook[]>('/looks');
  return response.data;
}

export async function createLook(payload: { title: string; cloth_ids: number[] }) {
  const response = await axiosInstance.post<ServerLook>('/looks', payload);
  return response.data;
}

export function mapServerClothToItem(cloth: ServerCloth): ClothingItem | null {
  const category = CATEGORY_MAP[(cloth.category ?? '').toLowerCase()];
  if (!category) {
    return null;
  }

  return {
    id: String(cloth.id),
    name: cloth.title,
    category,
    color: cloth.color || '#c9b39d',
    description: cloth.ai_metadata?.description || 'Вещь из вашего гардероба.',
    icon: category === 'top' ? '👕' : category === 'bottom' ? '👖' : '👟',
    imageUrl: cloth.image ? resolveAssetUrl(`/uploads/processed/${cloth.image}`) : undefined,
  };
}
