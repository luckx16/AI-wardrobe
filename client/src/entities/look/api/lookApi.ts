import { LOOK_API_ROUTES } from '@/shared/constants/lookApiRoutes';
import { axiosInstance } from '@/shared/lib/axiosInstance';
import type { ServerResponseType } from '@/shared/types';

import type { GeneratedLook, ILook } from '../model/types';

export type SavedLook = {
  id: string;
  title: string;
  cloth_ids: string[];
  createdAt: string;
};

export async function generateLook(payload: { userId: number; userPrompt?: string }) {
  const { data } = await axiosInstance.post<ServerResponseType<GeneratedLook>>(
    '/looks/generate',
    payload,
  );
  return data.data;
}

export async function saveLook(payload: { title: string; cloth_ids: number[] }) {
  const { data } = await axiosInstance.post<ServerResponseType<SavedLook>>('/looks', payload);
  return data.data;
}
export async function getLook(lookId: string) {
  const { data } = await axiosInstance.get<ServerResponseType<ILook>>(
    LOOK_API_ROUTES.LOOK(+lookId),
  );
  return data.data;
}
