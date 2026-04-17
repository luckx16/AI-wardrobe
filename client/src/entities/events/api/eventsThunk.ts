import { createAsyncThunk } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';

import { defaultRejectedAxiosError } from '@/shared/constants/defaultRejectedAxiosError';
import { EVENT_API_ROUTES } from '@/shared/constants/eventApiRoutes';
import { axiosInstance } from '@/shared/lib/axiosInstance';
import { ServerResponseType } from '@/shared/types';

import { ArrayEventsType, EventDataFromClient, IEvent } from '../model/types';

export const createEventThunk = createAsyncThunk<
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
export const updateEventThunk = createAsyncThunk<
  IEvent,
  EventDataFromClient & { editedEventId: number },
  { rejectValue: ServerResponseType }
>('events/update', async ({ editedEventId, ...eventDataFromClient }, { rejectWithValue }) => {
  try {
    const { data } = await axiosInstance.put<ServerResponseType<IEvent>>(
      EVENT_API_ROUTES.EVENT(editedEventId),
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

export const getAllEventsThunk = createAsyncThunk<
  ArrayEventsType,
  void,
  { rejectValue: ServerResponseType }
>('events/getAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await axiosInstance.get<ServerResponseType<ArrayEventsType>>(
      EVENT_API_ROUTES.EVENTS,
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

export const deleteEventThunk = createAsyncThunk<
  { isDeleted: boolean; deletedEventId: number },
  number,
  { rejectValue: ServerResponseType }
>('events/delete', async (deletedEventId, { rejectWithValue }) => {
  try {
    const { data } = await axiosInstance.delete<ServerResponseType<{ isDeleted: boolean }>>(
      EVENT_API_ROUTES.EVENT(deletedEventId),
    );

    return { isDeleted: data.data.isDeleted, deletedEventId };
  } catch (error) {
    const axiosError = error as AxiosError<ServerResponseType>;
    if (!axiosError.response) {
      return rejectWithValue(defaultRejectedAxiosError);
    }
    return rejectWithValue(axiosError.response.data);
  }
});
