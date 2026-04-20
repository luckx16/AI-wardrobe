import { createSlice } from '@reduxjs/toolkit';

import {
  createEventThunk,
  deleteEventThunk,
  getAllEventsThunk,
  updateEventThunk,
} from '../api/eventsThunk';
import { IEvent } from './types';

interface EventsState {
  events: IEvent[];
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
      /* --------------------- create event --------------------- */
      .addCase(createEventThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createEventThunk.fulfilled, (state, action) => {
        state.isLoading = false;

        if (action.payload) {
          state.events = [...state.events, action.payload];
        }
      })
      .addCase(createEventThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message ?? 'Ошибка при создании события';
      })
      /* --------------------- update event --------------------- */
      .addCase(updateEventThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateEventThunk.fulfilled, (state, action) => {
        state.isLoading = false;

        if (action.payload) {
          state.events = state.events.map((ev) =>
            ev.id === action.payload.id ? action.payload : ev,
          );
        }
      })
      .addCase(updateEventThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message ?? 'Ошибка при обновлении события';
      })
      /* --------------------- get all events --------------------- */
      .addCase(getAllEventsThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllEventsThunk.fulfilled, (state, action) => {
        state.isLoading = false;

        if (action.payload) {
          state.events = action.payload;
        }
      })
      .addCase(getAllEventsThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message ?? 'Ошибка при получении событий';
      })
      /* --------------------- delete event --------------------- */
      .addCase(deleteEventThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteEventThunk.fulfilled, (state, action) => {
        state.isLoading = false;

        if (action.payload.isDeleted) {
          state.events = state.events.filter((event) => event.id !== action.payload.deletedEventId);
        }
      })
      .addCase(deleteEventThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message ?? 'Ошибка при удалении события';
      });
  },
});

export const eventsReducer = eventsSlice.reducer;
