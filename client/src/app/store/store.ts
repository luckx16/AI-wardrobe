// Импорт сущностей для формирования store
import { configureStore } from '@reduxjs/toolkit';

import { userReducer } from '@/entities/user/slice/userSlice';

// Создание store
export const store = configureStore({
  reducer: {
    // Сущности внутри store
    user: userReducer,
  },
});

// Типы для store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
