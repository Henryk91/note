import React from 'react';
import { renderWithProviders } from '../src/test-utils';
import NoteDetail from '../src/features/notes/components/NoteDetail/NoteDetail';
import * as useNoteNavigation from '../src/features/notes/hooks/useNoteNavigation';
import * as useNoteOperations from '../src/features/notes/hooks/useNoteOperations';
import * as useNoteDateLogic from '../src/features/notes/hooks/useNoteDateLogic';

jest.mock('../src/features/notes/hooks/useNoteNavigation', () => ({
  useNoteNavigation: jest.fn(),
}));
jest.mock('../src/features/notes/hooks/useNoteOperations', () => ({
  useNoteOperations: jest.fn(),
}));
jest.mock('../src/features/notes/hooks/useNoteDateLogic', () => ({
  useNoteDateLogic: jest.fn(),
}));

jest.mock('../src/features/notes/components/NoteDetail/../NoteItem/NoteItem', () => () => (
  <div data-testid="note-item">NoteItem</div>
));
jest.mock('../src/features/notes/components/NoteDetail/forms', () => ({
  FolderList: () => <div data-testid="folder-list">FolderList</div>,
  AddItemForm: () => <div data-testid="add-item-form">AddItemForm</div>,
  EditNameForm: () => <div data-testid="edit-name-form">EditNameForm</div>,
}));

describe('NoteDetail', () => {
  test('matches snapshot', () => {
    (useNoteNavigation.useNoteNavigation as jest.Mock).mockReturnValue({
      openPage: jest.fn(),
      saveShowTag: jest.fn(),
      showHideBox: jest.fn(),
    });

    (useNoteOperations.useNoteOperations as jest.Mock).mockReturnValue({
      addLabel: [],
      submitNameChange: jest.fn(),
      submitNewItem: jest.fn(),
      cancelAddItemEdit: jest.fn(),
      updateNoteItem: jest.fn(),
      continueLog: jest.fn(),
    });

    // Note: useNoteDateLogic is no longer called by NoteDetail, but by NoteDetailTags.
    // We still mock it because NoteDetailTags renders it, and we want to control its output
    // so unrelated sub-components render predictably in the snapshot.
    (useNoteDateLogic.useNoteDateLogic as jest.Mock).mockReturnValue({
      displayDate: '2021-01-01',
      showLogDaysBunch: false,
      totalLogCount: 0,
      logDayMap: {},
      setDate: jest.fn(),
      changeDate: jest.fn(),
      dateBackForward: jest.fn(),
      showLogDays: jest.fn(),
    });

    const preloadedState = {
      person: {
        byId: {
          '1': { id: '1', dataLable: [], heading: 'Test Heading' },
        },
        pages: [{ params: { id: '1' } }],
        showTag: 'main',
        searchTerm: '',
        editName: false,
        showAddItem: false,
      },
      theme: { themeLower: 'dark' },
    };

    const { asFragment } = renderWithProviders(<NoteDetail index={0} />, { preloadedState });
    expect(asFragment()).toMatchSnapshot();
  });
});
