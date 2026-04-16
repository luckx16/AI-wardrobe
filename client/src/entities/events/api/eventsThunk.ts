import { createAsyncThunk } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';

import { defaultRejectedAxiosError } from '@/shared/constants/defaultRejectedAxiosError';
import { axiosInstance } from '@/shared/lib/axiosInstance';
import { ServerResponseType } from '@/shared/types';

import { CreateEventFromClient, StyleEvent } from '../model/types';

const EVENTS_API_ROUTES = {
  BASE: '/events',
} as const;

export const createEventThunk = createAsyncThunk<
  StyleEvent,
  CreateEventFromClient,
  { rejectValue: ServerResponseType }
>('events/create', async (eventDataFromClient, { rejectWithValue }) => {
  try {
    const { data } = await axiosInstance.post<ServerResponseType<StyleEvent>>(
      EVENTS_API_ROUTES.BASE,
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
