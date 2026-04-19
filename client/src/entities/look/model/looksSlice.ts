import { createSlice } from '@reduxjs/toolkit';

import {
  createLookThunk,
  deleteLookThunk,
  getAllLooksThunk,
  toggleLikeThunk,
  updateLookThunk,
} from '../api/lookThunk';
import { ILook } from './types';

interface LooksState {
  looks: ILook[];
  isLoading: boolean;
  error: string | null;
}

const initialState: LooksState = {
  looks: [],
  isLoading: false,
  error: null,
};

const looksSlice = createSlice({
  name: 'looks',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      /* --------------------- create look --------------------- */
      .addCase(createLookThunk.pending, (state) => {
        state.error = null;
      })
      .addCase(createLookThunk.fulfilled, (state, action) => {
        if (action.payload) {
          state.looks = [...state.looks, action.payload];
        }
      })
      .addCase(createLookThunk.rejected, (state, action) => {
        state.error = action.payload?.message ?? 'Ошибка при создании лука';
      })
      /* --------------------- update look --------------------- */
      .addCase(updateLookThunk.pending, (state) => {
        state.error = null;
      })
      .addCase(updateLookThunk.fulfilled, (state, action) => {
        if (action.payload) {
          state.looks = state.looks.map((look) =>
            look.id === action.payload.id ? action.payload : look,
          );
        }
      })
      .addCase(updateLookThunk.rejected, (state, action) => {
        state.error = action.payload?.message ?? 'Ошибка при обновлении лука';
      })
      /* --------------------- toggleLikeThunk --------------------- */
      .addCase(toggleLikeThunk.fulfilled, (state, action) => {
        if (action.payload) {
          state.looks = state.looks.map((look) =>
            look.id === action.payload.id
              ? { ...look, is_in_favorites: action.payload.is_in_favorites }
              : look,
          );
        }
      })
      .addCase(toggleLikeThunk.rejected, (state, action) => {
        state.error = action.payload?.message ?? 'Ошибка при  обновлении like лука';
      })
      /* --------------------- get all looks --------------------- */
      .addCase(getAllLooksThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllLooksThunk.fulfilled, (state, action) => {
        state.isLoading = false;

        if (action.payload) {
          state.looks = action.payload;
        }
      })
      .addCase(getAllLooksThunk.rejected, (state, action) => {
        state.error = action.payload?.message ?? 'Ошибка при получении луков';
      })

      /* --------------------- delete looks --------------------- */
      .addCase(deleteLookThunk.fulfilled, (state, action) => {
        if (action.payload.isDeleted) {
          state.looks = state.looks.filter((looks) => looks.id !== action.payload.deletedLookId);
        }
      })
      .addCase(deleteLookThunk.rejected, (state, action) => {
        state.error = action.payload?.message ?? 'Ошибка при удаления лука';
      });
  },
});

export const looksReducer = looksSlice.reducer;
