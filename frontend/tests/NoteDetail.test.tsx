import React from 'react';
import { renderWithProviders } from '../src/test-utils';
import NoteDetail from '../src/features/notes/components/NoteDetail/NoteDetail';
import * as useNoteDetailLogic from '../src/features/notes/hooks/useNoteDetailLogic';

jest.mock('../src/features/notes/hooks/useNoteDetailLogic', () => ({
  useNoteDetailLogic: jest.fn(),
}));

jest.mock('../src/features/notes/components/NoteDetail/../NoteItem/NoteItem', () => () => <div data-testid="note-item">NoteItem</div>);
jest.mock('../src/features/notes/components/NoteDetail/forms', () => ({
  NoteDetailListItem: () => <div data-testid="note-detail-list-item">NoteDetailListItem</div>,
}));

describe('NoteDetail', () => {
  test('matches snapshot', () => {
    (useNoteDetailLogic.useNoteDetailLogic as jest.Mock).mockReturnValue({
      person: { id: '1', dataLable: [] },
      persons: {},
      addLable: [],
      displayDate: '2021-01-01',
      continueData: null,
      showLogDaysBunch: false,
      totalLogCount: 0,
      logDayMap: {},
      showTag: 'main',
      selectedNoteName: '1',
      setPrevDate: jest.fn(),
      setNextDate: jest.fn(),
      setDate: jest.fn(),
      enableAnimationCheck: jest.fn(),
      updateNoteItem: jest.fn(),
      continueLog: jest.fn(),
      showHideBox: jest.fn(),
      showLogDays: jest.fn(),
      saveShowTag: jest.fn(),
      changeDate: jest.fn(),
      dateBackForward: jest.fn(),
      submitNameChange: jest.fn(),
      submitNewItem: jest.fn(),
      cancelAddItemEdit: jest.fn(),
    });

    const props = {
      searchTerm: '',
      set: jest.fn(),
      openPage: jest.fn(),
      lastPage: true,
      showAddItem: false,
      pageCount: 1,
      match: { params: { id: '1' }, url: '/notes/1', isExact: true, path: '/notes/:id' },
      initShowtag: 'Note' as any,
    } as any;

    const { asFragment } = renderWithProviders(<NoteDetail {...props} />);
    expect(asFragment()).toMatchSnapshot();
  });
});
