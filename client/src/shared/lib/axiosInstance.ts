import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

import type { UserWithTokenType } from '@/entities/user/model/types';
import { USER_API_ROUTES } from '@/shared/constants/userApiRoutes';
import type { ServerResponseType } from '@/shared/types';

interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  sent?: boolean;
}

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'api',
  withCredentials: true,
});

let accessToken = '';

export function setAccessToken(token: string): void {
  accessToken = token;
}

export function getAccessToken(): string {
  return accessToken;
}

axiosInstance.interceptors.request.use(
  (config: ExtendedAxiosRequestConfig): ExtendedAxiosRequestConfig => {
    if (config.headers && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  async (error: AxiosError) => {
    const prevRequest: ExtendedAxiosRequestConfig | undefined = error.config;
    if (error.response?.status === 403 && prevRequest && !prevRequest.sent) {
      try {
        const response = await axiosInstance.get<ServerResponseType<UserWithTokenType>>(
          USER_API_ROUTES.REFRESH_TOKENS,
        );
        const payload = response.data.data;
        accessToken = payload?.accessToken ?? '';

        prevRequest.sent = true;

        if (prevRequest.headers) {
          prevRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        return axiosInstance(prevRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
