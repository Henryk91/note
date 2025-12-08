import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { KeyValue, Note, PageDescriptor } from '../client/views/Helpers/types';
import { createInitPage, getStorageJsonData, setLogDirAtTop } from '../client/views/Helpers/utils';

type PersonState = {
  byId: KeyValue<Note>;
  notes: Note[] | null;
  noteNames?: string[];
  selectedNoteName?: string;
  showTag: string | null;
  showAddItem: boolean;
  editName: boolean;
  pages: PageDescriptor[];
  reloadLastPage: boolean;
};

type SetPersonPayload = {
  id: string;
  person?: Note | null;
};

const initSelectedNoteName = localStorage.getItem('user') || undefined;

const initialState: PersonState = {
  byId: getStorageJsonData(`${initSelectedNoteName}-data`, {}),
  notes: null,
  selectedNoteName: initSelectedNoteName,
  showTag: localStorage.getItem('showTag') || null,
  showAddItem: !!localStorage.getItem('new-folder-edit'),
  editName: false,
  pages: getStorageJsonData('saved-pages', [createInitPage(initSelectedNoteName)]),
  noteNames: getStorageJsonData('notenames'),
  reloadLastPage: false,
};

const personSlice = createSlice({
  name: 'person',
  initialState,
  reducers: {
    bulkUpdatePerson(state, action: PayloadAction<KeyValue<Note>>) {
      const p = action.payload;
      if (!p) return;
      const freshState = { ...state.byId };
      const keys = Object.keys(p);
      keys.forEach((key) => {
        if (p[key].id === p[key].heading){
          p[key].dataLable.sort((a, b) => (a?.name ?? '').localeCompare(b?.name ?? ''));
        }
        freshState[key] = setLogDirAtTop(p[key]);
      });

      state.byId = freshState;

      if (state.selectedNoteName && freshState) {
        const storageKey = `${state.selectedNoteName}-data`;
        localStorage.setItem(storageKey, JSON.stringify(freshState));
      }
    },
    setPersonById(state, action: PayloadAction<SetPersonPayload>) {
      const { id, person } = action.payload;
      if (!person) return;
      state.byId[id] = setLogDirAtTop(person);
    },
    removePersonById(state, action: PayloadAction<{ id: string }>) {
      const { id } = action.payload;
      delete state.byId[id];
    },
    setNotes(state, action: PayloadAction<Note[] | null>) {
      state.notes = action.payload;
      if (state.selectedNoteName) localStorage.setItem(state.selectedNoteName, JSON.stringify(action.payload));
    },
    setNoteNames(state, action: PayloadAction<string[]>) {
      state.noteNames = action.payload;
      localStorage.setItem('notenames', JSON.stringify(action.payload));
    },
    setSelectedNoteName(state, action: PayloadAction<string>) {
      state.selectedNoteName = action.payload;
      localStorage.setItem('user', action.payload);
      const localNoteData = localStorage.getItem(action.payload);
      state.pages = [createInitPage(state.selectedNoteName)];
      localStorage.setItem('saved-pages', JSON.stringify(state.pages));
      if (localNoteData) {
        state.notes = JSON.parse(localNoteData);
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
      if (!action.payload) localStorage.removeItem('new-folder-edit');
    },
    setEditName(state, action: PayloadAction<boolean>) {
      state.editName = action.payload;
    },
    setPages(state, action: PayloadAction<PageDescriptor[]>) {
      state.pages = action.payload;
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
      const initialPages = [createInitPage(state.selectedNoteName)];
      state.pages = initialPages;
      localStorage.setItem('saved-pages', JSON.stringify(initialPages));
    },
    triggerLastPageReload(state) {
      state.reloadLastPage = !state.reloadLastPage;
    }
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
  bulkUpdatePerson,
  triggerLastPageReload
} = personSlice.actions;

export const selectPersonById = (state: { person: PersonState }, id: string) => state.person.byId[id] || null;
export const getAllPersonById = (state: { person: PersonState }) => state.person.byId || null;

export default personSlice.reducer;
