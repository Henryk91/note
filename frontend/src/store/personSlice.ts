import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Note, PageDescriptor } from '../client/views/Helpers/types';
import { DEFAULT_PAGE } from '../client/views/Helpers/const';
import { getPersonNoteType } from '../client/views/Helpers/utils';

type KeyValue<T = any> = {
  [key: string]: T;
};

type PersonState = {
  byId: KeyValue<Note>;
  notes: Note[] | null;
  noteNames?: string[];
  selectedNoteName?: string;
  showTag: string | null;
  showAddItem: boolean;
  editName: boolean;
  pages: PageDescriptor[];
};

type SetPersonPayload = {
  id: string;
  person?: Note | null;
};

const createInitPage = (selectedNoteName?: string) => {
  return { params: { id: selectedNoteName ?? 'main', tempId: selectedNoteName ?? 'main' } }
}

const initSelectedNoteName = localStorage.getItem('user') || undefined
const initialState: PersonState = {
  byId: {},
  notes: null,
  selectedNoteName: initSelectedNoteName,
  showTag: localStorage.getItem('showTag') || null,
  showAddItem: !!localStorage.getItem('new-folder-edit'),
  editName: false,
  pages: localStorage.getItem('saved-pages')? JSON.parse(localStorage.getItem('saved-pages')+"") :[{ params: { id: initSelectedNoteName ?? '1main', tempId: initSelectedNoteName ?? 'main' } }],
};
// console.log('initialState',initialState);
const personSlice = createSlice({
  name: 'person',
  initialState,
  reducers: {
    setPersonById(state, action: PayloadAction<SetPersonPayload>) {
      const { id, person } = action.payload;
      if (!person) return;
      state.byId[id] = person;
    },
    removePersonById(state, action: PayloadAction<{ id: string }>) {
      const { id } = action.payload;
      delete state.byId[id];
    },
    setNotes(state, action: PayloadAction<Note[] | null>) {
      state.notes = action.payload;
      if(state.selectedNoteName) localStorage.setItem(state.selectedNoteName, JSON.stringify(action.payload));
      if(action.payload) {
        // const personFound = getPersonNoteType(state.notes, DEFAULT_PAGE[0]);
        const initPage = createInitPage(state.selectedNoteName)
        // console.log('initPage',initPage);
        const personFound = getPersonNoteType(state.notes, initPage, state.selectedNoteName);
        // console.log('state.selectedNoteName',state.selectedNoteName);
        // console.log('personFound',personFound);
        if(personFound) state.byId[state.selectedNoteName ?? 'main'] = personFound;
      }
    },
    setNoteNames(state, action: PayloadAction<string[]>) {
      state.noteNames = action.payload;
    },
    setSelectedNoteName(state, action: PayloadAction<string>) {
      // console.error('setSelectedNoteName', action.payload);
      state.selectedNoteName = action.payload;
      localStorage.setItem('user', action.payload);
      const localNoteData = localStorage.getItem(action.payload);
      state.pages = [createInitPage(state.selectedNoteName)]
      localStorage.setItem('saved-pages', JSON.stringify(state.pages));
      if(localNoteData) {
        state.notes = JSON.parse(localNoteData);
        // const personFound = getPersonNoteType(state.notes, DEFAULT_PAGE[0]);
        // console.log('state.pages[0]',state.pages[0]);
        const personFound = getPersonNoteType(state.notes, state.pages[0], state.selectedNoteName);
        // console.error('personFound',personFound);
        if(personFound) state.byId[state.selectedNoteName ?? 'main'] = personFound;
        
      } else {
        // console.error('Here', state.pages[0], state.selectedNoteName);
        // console.log('state.notes',state.notes);
        const personFound = getPersonNoteType(state.notes, state.pages[0], state.selectedNoteName);
        // console.error('personFound',personFound);
        if(personFound) {
          state.byId[state.selectedNoteName ?? 'main'] = personFound;
        } else {
          state.byId = {}
        }
        
      }
    },
    setShowTag(state, action: PayloadAction<string | null>) {
      state.showTag = action.payload;
      if (action.payload) {
        localStorage.setItem('showTag', action.payload);
      } else {
        localStorage.removeItem('showTag');
      }
    },
    setShowAddItem(state, action: PayloadAction<boolean>) {
      state.showAddItem = action.payload;
      if(!action.payload) localStorage.removeItem('new-folder-edit');
    },
    setEditName(state, action: PayloadAction<boolean>) {
      state.editName = action.payload;
    },
    setPages(state, action: PayloadAction<PageDescriptor[]>) {
      state.pages = action.payload
      localStorage.setItem('saved-pages', JSON.stringify(state.pages));
    },
    addPage(state, action: PayloadAction<PageDescriptor>) {
      state.pages.push(action.payload);
      localStorage.setItem('saved-pages', JSON.stringify(state.pages));
    },
    removePage(state, action: PayloadAction<PageDescriptor>) {
      state.pages = state.pages.filter((page) => page.params.id !== action.payload.params.id);
      localStorage.setItem('saved-pages', JSON.stringify(state.pages));
    },
    removeLastPage(state) {
      state.pages = state.pages.slice(0, state.pages.length - 1);
      localStorage.setItem('saved-pages', JSON.stringify(state.pages));
    },
    resetPages(state) {
      // console.error('resetPages');
      state.pages = [createInitPage(state.selectedNoteName)];
      localStorage.setItem('saved-pages', JSON.stringify([createInitPage(state.selectedNoteName)]));
    },
  },
});

export const {
  setPersonById,
  removePersonById,
  setNotes,
  setNoteNames,
  setSelectedNoteName,
  setShowTag,
  setShowAddItem,
  setEditName,
  addPage,
  removePage,
  removeLastPage,
  resetPages,
  setPages,
} = personSlice.actions;

export const selectPersonById = (state: { person: PersonState }, id: string) => state.person.byId[id] || null;
export const getAllPersonById = (state: { person: PersonState }) => state.person.byId || null;

export default personSlice.reducer;
