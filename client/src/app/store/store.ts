// Импорт сущностей для формирования store
import { configureStore } from '@reduxjs/toolkit';

import { clothReducer } from '@/entities/cloth/model/clothSlice';
import { eventsReducer } from '@/entities/events/model/eventsSlice';
import { looksReducer } from '@/entities/look/model/looksSlice';
import { userReducer } from '@/entities/user/slice/userSlice';

// Создание store
export const store = configureStore({
  reducer: {
    // Сущности внутри store
    user: userReducer,
    events: eventsReducer,
    looks: looksReducer,
    cloth: clothReducer,
  },
});

// Типы для store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
