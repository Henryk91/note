import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type ThemeState = {
  value: string;
};

const initialState: ThemeState = {
  value: 'Dark',
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<string>) {
      state.value = action.payload;
    },
  },
});

export const { setTheme } = themeSlice.actions;
export default themeSlice.reducer;
