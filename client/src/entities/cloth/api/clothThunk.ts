import { createAsyncThunk } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';

import { CLOTH_API_ROUTES } from '@/shared/constants/clothApiRoutes';
import { defaultRejectedAxiosError } from '@/shared/constants/defaultRejectedAxiosError';
import { axiosInstance } from '@/shared/lib/axiosInstance';
import { ServerResponseType } from '@/shared/types';

import { IClothFromDb } from '../model/types';

export const getAllClothesThunk = createAsyncThunk<
  IClothFromDb[],
  void,
  { rejectValue: ServerResponseType }
>('cloth/getAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await axiosInstance.get<ServerResponseType<IClothFromDb[]>>(
      CLOTH_API_ROUTES.CLOTH,
    );

    return data.data;
  } catch (error) {
    const axiosError = error as AxiosError<ServerResponseType>;
    if (!axiosError.response) {
      return rejectWithValue(defaultRejectedAxiosError);
    }
    return rejectWithValue(axiosError.response.data);
  }
});
