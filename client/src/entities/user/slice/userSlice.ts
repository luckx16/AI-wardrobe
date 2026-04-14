import { createSlice } from '@reduxjs/toolkit';

import {
  deleteUserThunk,
  refreshTokensThunk,
  signInThunk,
  signOutThunk,
  signUpThunk,
} from '@/entities/user/api/apiUserThunk';
import { UserType } from '@/entities/user/model/types';
import { ServerResponseType } from '@/shared/types';

// Типы статусов пользователя
type UserStatus = 'empty' | 'pending' | 'succeeded' | 'failed';

// Тип для состояния пользователя
type UserState = {
  user: UserType | null;
  status: UserStatus;
  lastError: ServerResponseType | null;
};

// Начальное состояние пользователя
const initialState: UserState = {
  user: null,
  status: 'empty',
  lastError: null,
};

// Создание slice для пользователя
export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Синхронные действия
  },
  extraReducers: (builder) => {
    // Асинхронные действия
    builder
      // Вход в систему
      .addCase(signInThunk.pending, (state) => {
        // Установка статуса в pending
        state.status = 'pending';
      })
      .addCase(signInThunk.fulfilled, (state, action) => {
        // Установка статуса в succeeded
        state.status = 'succeeded';
        // Установка пользователя
        state.user = action.payload.user;
      })
      .addCase(signInThunk.rejected, (state, action) => {
        // Установка статуса в failed
        state.status = 'failed';
        // Установка последней ошибки
        state.lastError = action.payload ?? null;
      })
      // Выход из системы
      .addCase(signOutThunk.pending, (state) => {
        // Установка статуса в pending
        state.status = 'pending';
      })
      .addCase(signOutThunk.fulfilled, (state) => {
        // Установка статуса в succeeded
        state.status = 'empty';
        // Установка пользователя в null
        state.user = null;
      })
      .addCase(signOutThunk.rejected, (state, action) => {
        // Установка статуса в failed
        state.status = 'failed';
        // Установка последней ошибки
        state.lastError = action.payload ?? null;
      })
      // Удаление текущего пользователя
      .addCase(deleteUserThunk.pending, (state) => {
        // Установка статуса в pending
        state.status = 'pending';
      })
      .addCase(deleteUserThunk.fulfilled, (state) => {
        // Установка статуса в succeeded
        state.status = 'empty';
        // Установка пользователя в null
        state.user = null;
      })
      .addCase(deleteUserThunk.rejected, (state, action) => {
        // Установка статуса в failed
        state.status = 'failed';
        // Установка последней ошибки
        state.lastError = action.payload ?? null;
      })
      // Обновление токенов
      .addCase(refreshTokensThunk.pending, (state) => {
        // Установка статуса в pending
        state.status = 'pending';
      })
      .addCase(refreshTokensThunk.fulfilled, (state, action) => {
        // Установка статуса в succeeded
        state.status = 'succeeded';
        // Установка пользователя
        state.user = action.payload.user;
      })
      .addCase(refreshTokensThunk.rejected, (state, action) => {
        // Установка статуса в failed
        state.status = 'failed';
        // Установка последней ошибки
        state.lastError = action.payload ?? null;
      })
      // Регистрация пользователя
      .addCase(signUpThunk.pending, (state) => {
        // Установка статуса в pending
        state.status = 'pending';
      })
      .addCase(signUpThunk.fulfilled, (state, action) => {
        // Установка статуса в succeeded
        state.status = 'succeeded';
        // Установка пользователя
        state.user = action.payload.user;
      })
      .addCase(signUpThunk.rejected, (state, action) => {
        // Установка статуса в failed
        state.status = 'failed';
        // Установка последней ошибки
        state.lastError = action.payload ?? null;
      });
  },
});

export const userReducer = userSlice.reducer;
