import { axiosInstance } from '@/shared/lib/axiosInstance';
import type { ServerResponseType } from '@/shared/types';

type UploadResult = {
  url: string;
  field: 'portrait_photo' | 'body_photo';
};

function apiOrigin(): string {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) return '';
  return base.replace(/\/api\/?$/, '');
}

export function resolveAssetUrl(url: string): string {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  if (!url.startsWith('/')) return url;
  const origin = apiOrigin();
  return origin ? `${origin}${url}` : url;
}

export async function uploadPortraitPhoto(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('portrait_photo', file);
  const { data } = await axiosInstance.post<ServerResponseType<UploadResult>>('/upload/portrait', formData);
  const payload = data.data;
  return { ...payload, url: resolveAssetUrl(payload.url) };
}

export async function uploadBodyPhoto(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('body_photo', file);
  const { data } = await axiosInstance.post<ServerResponseType<UploadResult>>('/upload/body', formData);
  const payload = data.data;
  return { ...payload, url: resolveAssetUrl(payload.url) };
}

