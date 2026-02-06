import React from 'react';
import { renderWithProviders } from '../src/test-utils';
import NoteDetailPage from '../src/features/notes/pages/NoteDetailPage/NoteDetailPage';
import * as useNotesQueries from '../src/features/notes/hooks/useNotesQueries';

jest.mock('../src/features/notes/hooks/useNotesQueries', () => ({
  useNoteNames: jest.fn(),
}));

jest.mock('../src/shared/components/organisms/Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
}));

jest.mock('../src/features/notes/components/ScrollButtons', () => ({
  ScrollButtons: () => <div data-testid="scroll-buttons">ScrollButtons</div>,
}));

jest.mock('../src/shared/components/atoms/BackButton', () => ({
  BackButton: () => <div data-testid="back-button">BackButton</div>,
}));

describe('NoteDetailPage', () => {
  test('matches snapshot', () => {
    (useNotesQueries.useNoteNames as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });

    const props = {
      set: jest.fn(),
      searchTerm: '',
      match: { url: '/notes/1', params: {}, isExact: true, path: '' },
    } as any;

    const { asFragment } = renderWithProviders(<NoteDetailPage {...props} />);
    expect(asFragment()).toMatchSnapshot();
  });
});
