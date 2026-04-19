import { createAsyncThunk } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';

import { defaultRejectedAxiosError } from '@/shared/constants/defaultRejectedAxiosError';
import { LOOK_API_ROUTES } from '@/shared/constants/lookApiRoutes';
import { axiosInstance } from '@/shared/lib/axiosInstance';
import { ServerResponseType } from '@/shared/types';

import { ArrayLooksType, ILook } from '../model/types';

export const createLookThunk = createAsyncThunk<
  ILook,
  { title: string; cloth_ids: string[] },
  { rejectValue: ServerResponseType }
>('looks/create', async (lookDataObj, { rejectWithValue }) => {
  try {
    const { data } = await axiosInstance.post<ServerResponseType<ILook>>(
      LOOK_API_ROUTES.LOOKS,
      lookDataObj,
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
export const updateLookThunk = createAsyncThunk<
  ILook,
  { id: string; title: string; cloth_ids: string[] },
  { rejectValue: ServerResponseType }
>('looks/update', async ({ id, ...lookDataObj }, { rejectWithValue }) => {
  try {
    const { data } = await axiosInstance.put<ServerResponseType<ILook>>(
      LOOK_API_ROUTES.LOOK(id),
      lookDataObj,
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

export const getAllLooksThunk = createAsyncThunk<
  ArrayLooksType,
  void,
  { rejectValue: ServerResponseType }
>('looks/getAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await axiosInstance.get<ServerResponseType<ArrayLooksType>>(
      LOOK_API_ROUTES.LOOKS,
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

export const toggleLikeThunk = createAsyncThunk<ILook, string, { rejectValue: ServerResponseType }>(
  'lookLike/update',
  async (editedLookId, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.put<ServerResponseType<ILook>>(
        LOOK_API_ROUTES.LOOK_LIKE(editedLookId),
      );

      return data.data;
    } catch (error) {
      const axiosError = error as AxiosError<ServerResponseType>;
      if (!axiosError.response) {
        return rejectWithValue(defaultRejectedAxiosError);
      }
      return rejectWithValue(axiosError.response.data);
    }
  },
);

export const deleteLookThunk = createAsyncThunk<
  { isDeleted: boolean; deletedLookId: string },
  string,
  { rejectValue: ServerResponseType }
>('looks/delete', async (deletedLookId, { rejectWithValue }) => {
  try {
    const { data } = await axiosInstance.delete<ServerResponseType<{ deleted: boolean }>>(
      LOOK_API_ROUTES.LOOK(deletedLookId),
    );
    return { isDeleted: data.data.deleted, deletedLookId };
  } catch (error) {
    const axiosError = error as AxiosError<ServerResponseType>;
    if (!axiosError.response) {
      return rejectWithValue(defaultRejectedAxiosError);
    }
    return rejectWithValue(axiosError.response.data);
  }
});
