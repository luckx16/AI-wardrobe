// Импорт createAsyncThunk из redux toolkit
import { createAsyncThunk } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';

import { UserWithTokenType } from '@/entities/user/model/types';
import { ISignInData, ISignUpData } from '@/entities/user/model/types';
import { defaultRejectedAxiosError } from '@/shared/constants/defaultRejectedAxiosError';
import { USER_API_ROUTES } from '@/shared/constants/userApiRoutes';
import { axiosInstance } from '@/shared/lib/axiosInstance';
import { setAccessToken } from '@/shared/lib/axiosInstance';
import { ServerResponseType } from '@/shared/types';

// Thunk для входа в систему
export const signInThunk = createAsyncThunk<
  UserWithTokenType,
  ISignInData,
  { rejectValue: ServerResponseType }
>(
  '***user/signIn***', // action name
  async (userData, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post<ServerResponseType<UserWithTokenType>>(
        USER_API_ROUTES.SIGN_IN,
        userData,
      );
      if (data.data?.accessToken) {
        setAccessToken(data.data.accessToken);
      }
      console.log('token:', data.data.accessToken);
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

// Thunk для выхода из системы
export const signOutThunk = createAsyncThunk<void, void, { rejectValue: ServerResponseType }>(
  '***user/signOut***', // action name
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.delete<ServerResponseType<void>>(
        USER_API_ROUTES.SIGN_OUT,
      );
      setAccessToken('');
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

// Thunk для удаления текущего пользователя
export const deleteUserThunk = createAsyncThunk<null, number, { rejectValue: ServerResponseType }>(
  '***user/deleteUser***', // action name
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.delete<ServerResponseType<null>>(
        `${USER_API_ROUTES.DELETE_USER}/${id}`,
      );
      if (data.statusCode === 200) {
        setAccessToken('');
        return data.data;
      }
      throw new Error(data.message);
    } catch (error) {
      const axiosError = error as AxiosError<ServerResponseType>;
      if (!axiosError.response) {
        return rejectWithValue(defaultRejectedAxiosError);
      }
      return rejectWithValue(axiosError.response.data);
    }
  },
);

// Thunk для обновления токенов
export const refreshTokensThunk = createAsyncThunk<
  UserWithTokenType,
  void,
  { rejectValue: ServerResponseType }
>(
  '***user/refreshTokens***', // action name
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get<ServerResponseType<UserWithTokenType>>(
        USER_API_ROUTES.REFRESH_TOKENS,
      );
      if (data.data?.accessToken) {
        setAccessToken(data.data.accessToken);
      }
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

// Thunk для регистрации пользователя
export const signUpThunk = createAsyncThunk<
  UserWithTokenType,
  ISignUpData,
  { rejectValue: ServerResponseType }
>(
  '***user/signUp***', // action name
  async (userData, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post<ServerResponseType<UserWithTokenType>>(
        USER_API_ROUTES.SIGN_UP,
        userData,
      );
      if (data.statusCode !== 201 || !data.data) {
        throw new Error(data.message);
      }
      if (data.data.accessToken) {
        setAccessToken(data.data.accessToken);
      }
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
