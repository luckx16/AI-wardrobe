// Импорт сущностей для формирования store
import { configureStore } from '@reduxjs/toolkit';

import { eventsReducer } from '@/entities/events/model/eventsSlice';
import { looksReducer } from '@/entities/looks/model/looksSlice';
import { userReducer } from '@/entities/user/slice/userSlice';

// Создание store
export const store = configureStore({
  reducer: {
    // Сущности внутри store
    user: userReducer,
    events: eventsReducer,
    looks: looksReducer,
  },
});

// Типы для store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
