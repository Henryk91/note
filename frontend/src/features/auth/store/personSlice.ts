import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { KeyValue, Note, PageDescriptor } from '../../../shared/utils/Helpers/types';
import {
  createInitPage,
  getStorageJsonData,
  setLogDirAtTop,
} from '../../../shared/utils/Helpers/utils';

type PersonState = {
  byId: KeyValue<Note>;
  selectedNoteName?: string;
  showTag: string | null;
  showAddItem: boolean;
  editName: boolean;
  pages: PageDescriptor[];
  reloadLastPage: boolean;
  searchTerm: string;
};

type SetPersonPayload = {
  id: string;
  person?: Note | null;
};

const initSelectedNoteName = localStorage.getItem('user') || undefined;

const initialState: PersonState = {
  byId: getStorageJsonData(`${initSelectedNoteName}-data`, {}),
  selectedNoteName: initSelectedNoteName,
  showTag: localStorage.getItem('showTag') || null,
  showAddItem: !!localStorage.getItem('new-folder-edit'),
  editName: false,
  pages: (() => {
    const savedPages = getStorageJsonData('saved-pages', [createInitPage(initSelectedNoteName)]);
    return Array.isArray(savedPages) ? savedPages : [createInitPage(initSelectedNoteName)];
  })(),
  reloadLastPage: false,
  searchTerm: '',
};

const personSlice = createSlice({
  name: 'person',
  initialState,
  reducers: {
    setSearchTerm(state, action: PayloadAction<string>) {
      state.searchTerm = action.payload;
    },
    setPersonById(state, action: PayloadAction<SetPersonPayload>) {
      const { id, person } = action.payload;
      if (!person) return;
      state.byId[id] = setLogDirAtTop(person);
    },
    setByIdState(state, action: PayloadAction<{ byId: KeyValue<Note> }>) {
      state.byId = { ...state.byId, ...action.payload.byId };
    },
    removePersonById(state, action: PayloadAction<{ id: string }>) {
      const { id } = action.payload;
      delete state.byId[id];
    },
    setSelectedNoteName(state, action: PayloadAction<string>) {
      state.selectedNoteName = action.payload;
      localStorage.setItem('user', action.payload);
      state.pages = [createInitPage(state.selectedNoteName)];
      localStorage.setItem('saved-pages', JSON.stringify(state.pages));
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
    },
  },
});

export const {
  setSearchTerm,
  setPersonById,
  setByIdState,
  removePersonById,
  setSelectedNoteName,
  setShowTag,
  setShowAddItem,
  setEditName,
  addPage,
  removePage,
  removeLastPage,
  resetPages,
  setPages,
  triggerLastPageReload,
} = personSlice.actions;

export const selectPersonById = (state: { person: PersonState }, id: string) => state.person.byId[id] || null;
export const getAllPersonById = (state: { person: PersonState }) => state.person.byId || null;

export default personSlice.reducer;
