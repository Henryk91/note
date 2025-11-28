import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type ThemeState = {
  value: string;
  themeLower: string;
};

const initialState: ThemeState = {
  value: localStorage.getItem('theme') ?? 'Dark',
  themeLower: localStorage.getItem('theme')?.toLowerCase() ?? 'dark',
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<string>) {
      state.value = action.payload;
      state.themeLower = action.payload.toLowerCase();
      localStorage.setItem('theme', action.payload);
    },
  },
});

export const { setTheme } = themeSlice.actions;
export default themeSlice.reducer;
