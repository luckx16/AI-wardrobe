import { createAsyncThunk } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';

import { defaultRejectedAxiosError } from '@/shared/constants/defaultRejectedAxiosError';
import { LOOK_API_ROUTES } from '@/shared/constants/lookApiRoutes';
import { axiosInstance } from '@/shared/lib/axiosInstance';
import { ServerResponseType } from '@/shared/types';

import { ArrayLooksType, ILook, ILookDataFromClient } from '../model/types';

/* export const createLookThunk = createAsyncThunk<
  IEvent,
  EventDataFromClient,
  { rejectValue: ServerResponseType }
>('events/create', async (eventDataFromClient, { rejectWithValue }) => {
  try {
    const { data } = await axiosInstance.post<ServerResponseType<IEvent>>(
      EVENT_API_ROUTES.EVENTS,
      eventDataFromClient,
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
 */

export const getAllLooksThunk = createAsyncThunk<
  ArrayLooksType,
  void,
  { rejectValue: ServerResponseType }
>('outfits/getAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await axiosInstance.post<ServerResponseType<ArrayLooksType>>(
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

export const updateLookThunk = createAsyncThunk<
  ILook,
  ILookDataFromClient & { editedEventId: number },
  { rejectValue: ServerResponseType }
>('events/update', async ({ editedEventId, ...lookDataFromClient }, { rejectWithValue }) => {
  try {
    const { data } = await axiosInstance.put<ServerResponseType<ILook>>(
      LOOK_API_ROUTES.LOOK(editedEventId),
      lookDataFromClient,
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

export const deleteLookThunk = createAsyncThunk<
  { isDeleted: boolean; deletedLookId: number },
  number,
  { rejectValue: ServerResponseType }
>('looks/delete', async (deletedLookId, { rejectWithValue }) => {
  try {
    const { data } = await axiosInstance.delete<ServerResponseType<{ isDeleted: boolean }>>(
      LOOK_API_ROUTES.LOOK(deletedLookId),
    );

    return { isDeleted: data.data.isDeleted, deletedLookId };
  } catch (error) {
    const axiosError = error as AxiosError<ServerResponseType>;
    if (!axiosError.response) {
      return rejectWithValue(defaultRejectedAxiosError);
    }
    return rejectWithValue(axiosError.response.data);
  }
});
