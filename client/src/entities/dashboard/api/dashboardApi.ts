import { DASHBOARD_API_ROUTES } from '@/shared/constants/dashboardApiRoutes';
import { axiosInstance } from '@/shared/lib/axiosInstance';
import { ServerResponseType } from '@/shared/types';

import { DashboardNumbersResponse, DashboardSectionsResponse } from '../model/types';

export const loadDashboardNumbersApi = async () => {
  try {
    const { data } = await axiosInstance.get<ServerResponseType<DashboardNumbersResponse>>(
      DASHBOARD_API_ROUTES.NUMBERS,
    );

    return data.data ?? null;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const loadDashboardSectionsApi = async () => {
  try {
    const { data } = await axiosInstance.get<ServerResponseType<DashboardSectionsResponse>>(
      DASHBOARD_API_ROUTES.SECTIONS,
    );

    return data.data ?? null;
  } catch (error) {
    console.error(error);
    return null;
  }
};
