import { PROFILE_API_ROUTES } from '@/shared/constants/profileApiRoutes';
import { axiosInstance } from '@/shared/lib/axiosInstance';
import type { ServerResponseType } from '@/shared/types';

type Contrast = 'low' | 'medium' | 'high';
type SkinTone = 'cool' | 'warm' | 'neutral';
type Proportion = 'standard' | 'long' | 'short';

export type StringListLike = string[] | { items: string[] };

export type ProfileDto = {
  id: number;
  user_id: number;
  user: {
    id: number;
    name: string;
    age: number | null;
  } | null;
  skin_tone: SkinTone | null;
  contrast: Contrast | null;
  portrait_photo: string | null;
  body_photo: string | null;
  height: number | null;
  waist: number | null;
  bust: number | null;
  hips: number | null;
  foot_length: number | null;
  proportion: Proportion | null;
  wishes: string | null;
  prefs: StringListLike | null;
  dislikes: StringListLike | null;
  additions: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProfileUpsertPayload = Partial<{
  name: string;
  age: number | null;
  skin_tone: SkinTone | null;
  contrast: Contrast | null;
  portrait_photo: string | null;
  body_photo: string | null;
  height: number | null;
  waist: number | null;
  bust: number | null;
  hips: number | null;
  foot_length: number | null;
  proportion: Proportion | null;
  wishes: string | null;
  prefs: string[];
  dislikes: string[];
  additions: string | null;
}>;

export async function getProfile(): Promise<ProfileDto> {
  const { data } = await axiosInstance.get<ServerResponseType<ProfileDto>>(PROFILE_API_ROUTES.PROFILE);
  return data.data;
}

export async function upsertProfile(payload: ProfileUpsertPayload): Promise<ProfileDto> {
  const { data } = await axiosInstance.patch<ServerResponseType<ProfileDto>>(
    PROFILE_API_ROUTES.PROFILE,
    payload,
  );
  return data.data;
}

