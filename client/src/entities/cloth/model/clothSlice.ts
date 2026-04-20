import { createSlice } from '@reduxjs/toolkit';

import { getAllClothesThunk } from '../api/clothThunk';
import { IClothFromDb } from './types';

interface ClothState {
  clothes: IClothFromDb[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ClothState = {
  clothes: [],
  isLoading: false,
  error: null,
};

const clothSlice = createSlice({
  name: 'cloth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder

      /* --------------------- get all clothes --------------------- */
      .addCase(getAllClothesThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllClothesThunk.fulfilled, (state, action) => {
        state.isLoading = false;

        if (action.payload) {
          state.clothes = action.payload;
        }
      })
      .addCase(getAllClothesThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message ?? 'Ошибка при получении списка одежды';
      });
  },
});

export const clothReducer = clothSlice.reducer;
