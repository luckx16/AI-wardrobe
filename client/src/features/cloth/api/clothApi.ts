import { IClothFromDb } from '@/entities/cloth';
import { CLOTH_API_ROUTES } from '@/shared/constants/clothApiRoutes';
import { axiosInstance } from '@/shared/lib/axiosInstance';
import { resolveAssetUrl } from '@/shared/lib/uploadApi';
import type { ServerResponseType } from '@/shared/types';

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

export async function getClothes() {
  const { data } = await axiosInstance.get<ServerResponseType<IClothFromDb[]>>(
    CLOTH_API_ROUTES.CLOTH,
  );
  return data.data;
}

export function mapServerClothToItem(cloth: IClothFromDb) {
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
