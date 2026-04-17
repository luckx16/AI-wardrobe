import { axiosInstance } from '@/shared/lib/axiosInstance';

import type { GeneratedLook } from '../model/types';

export async function generateLook(payload: { userId: number; userPrompt?: string }) {
  const { data } = await axiosInstance.post<GeneratedLook>('/looks/generate', payload);
  return data;
}

export async function saveLook(payload: { title: string; cloth_ids: number[] }) {
  const { data } = await axiosInstance.post('/looks', payload);
  return data;
}

