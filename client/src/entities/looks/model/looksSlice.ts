import { createSlice } from '@reduxjs/toolkit';

import { deleteLookThunk, getAllLooksThunk, updateLookThunk } from '../api/lookThunk';
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
      // .addCase(createLookThunk.pending, (state) => {
      //   state.isLoading = true;
      //   state.error = null;
      // })
      // .addCase(createLookThunk.fulfilled, (state, action) => {
      //   state.isLoading = false;

      //   if (action.payload) {
      //     state.looks = [...state.looks, action.payload];
      //   }
      // })
      // .addCase(createLookThunk.rejected, (state, action) => {
      //   state.isLoading = false;
      //   state.error = action.payload?.message ?? 'Ошибка при создании лука';
      // })
      /* --------------------- update look --------------------- */
      .addCase(updateLookThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateLookThunk.fulfilled, (state, action) => {
        state.isLoading = false;

        if (action.payload) {
          state.looks = state.looks.map((look) =>
            look.id === action.payload.id ? action.payload : look,
          );
        }
      })
      .addCase(updateLookThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message ?? 'Ошибка при обновлении лука';
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
        state.isLoading = false;
        state.error = action.payload?.message ?? 'Ошибка при получении луков';
      })
      /* --------------------- delete looks --------------------- */
      .addCase(deleteLookThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteLookThunk.fulfilled, (state, action) => {
        state.isLoading = false;

        if (action.payload.isDeleted) {
          state.looks = state.looks.filter((looks) => looks.id !== action.payload.deletedLookId);
        }
      })
      .addCase(deleteLookThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message ?? 'Ошибка при удаления лука';
      });
  },
});

export const looksReducer = looksSlice.reducer;
