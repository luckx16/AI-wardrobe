// Импорт сущностей для формирования store
import { configureStore } from '@reduxjs/toolkit';

import { userReducer } from '@/entities/user/slice/userSlice';
import { eventsReducer } from '@/entities/events/model/eventsSlice';

// Создание store
export const store = configureStore({
  reducer: {
    // Сущности внутри store
    user: userReducer,
    events: eventsReducer,
  },
});

// Типы для store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
