import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Note } from '../client/views/Helpers/types';

type KeyValue<T = any> = {
  [key: string]: T;
};


type PersonState = {
  byId: KeyValue<Note>;
};

type SetPersonPayload = {
  id: string;
  person?: Note | null;
};

const initialState: PersonState = {
  byId: {},
};

const personSlice = createSlice({
  name: 'person',
  initialState,
  reducers: {
    setPersonById(state, action: PayloadAction<SetPersonPayload>) {
      const { id, person } = action.payload;
      if (!person) return;
      state.byId[id] = person;
    },
    removePersonById(state, action: PayloadAction<{id: string}>) {
      const { id } = action.payload;
      delete state.byId[id];
      const keys = Object.keys(state.byId)
    },
  },
});

export const { setPersonById, removePersonById } = personSlice.actions;

export const selectPersonById = (state: { person: PersonState }, id: string) => state.person.byId[id] || null;
export const getAllPersonById = (state: { person: PersonState }) => state.person.byId || null;

export default personSlice.reducer;
