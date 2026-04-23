import { IClothFromDb } from '@/entities/cloth';

export type GeneratedLookCloth = {
  id: number | string;
  title: string;
  category: string | null;
  section: string | null;
  color: string | null;
  brand?: string | null;
  material?: string | null;
  season?: string | null;
  image?: string | null;
  role: string;
  reason?: string;
};

export type GeneratedLook = {
  look: {
    id: number | string;
    user_id: number | string;
    title: string;
    metadata?: {
      occasion?: string;
      item_roles?: Record<string, string>;
    };
    createdAt?: string;
    updatedAt?: string;
  };
  cloths: GeneratedLookCloth[];
  comment?: string;
};

export interface ILook {
  id: string;
  user_id: string;
  title: string;
  metadata: Record<string, unknown>;
  is_in_favorites: false;
  createdAt: string;
  updatedAt: string;
  clothes: IClothFromDb[];
}

export type ArrayLooksType = Array<ILook>;
