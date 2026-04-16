import { axiosInstance } from '@/shared/lib/axiosInstance';
import { PROFILE_API_ROUTES } from '@/shared/constants/profileApiRoutes';

type Contrast = 'low' | 'medium' | 'high';
type SkinTone = 'cool' | 'warm' | 'neutral';
type Proportion = 'standard' | 'long' | 'short';

export type StringListLike = string[] | { items: string[] };

export type ProfileDto = {
  id: number;
  user_id: number;
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
  const { data } = await axiosInstance.get<ProfileDto>(PROFILE_API_ROUTES.PROFILE);
  return data;
}

export async function upsertProfile(payload: ProfileUpsertPayload): Promise<ProfileDto> {
  const { data } = await axiosInstance.patch<ProfileDto>(PROFILE_API_ROUTES.PROFILE, payload);
  return data;
}

