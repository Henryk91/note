import { configureStore } from '@reduxjs/toolkit';
import themeReducer from './themeSlice';
import personReducer from './personSlice';

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    person: personReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
