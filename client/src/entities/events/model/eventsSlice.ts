import { createSlice } from '@reduxjs/toolkit';

import { createEventThunk } from '../api/eventsThunk';
import { StyleEvent } from './types';

interface EventsState {
  events: StyleEvent[];
  isLoading: boolean;
  error: string | null;
}

const initialState: EventsState = {
  events: [],
  isLoading: false,
  error: null,
};

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createEventThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createEventThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.events.push(action.payload);
      })
      .addCase(createEventThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message ?? 'Ошибка при создании события';
      });
  },
});

export const eventsReducer = eventsSlice.reducer;
