import React from 'react';
import { renderWithProviders } from '../src/test-utils';
import { Sidebar } from '../src/shared/components/organisms/Sidebar';

jest.mock('../src/features/notes/hooks/useNotesQueries', () => ({
  useNoteNames: jest.fn(() => ({ data: ['Note1', 'Note2'] })),
  useNotesWithChildren: jest.fn(() => ({ data: { notes: {} }, isLoading: false })),
  useUpdateNote: jest.fn(() => ({ mutate: jest.fn() })),
  useCreateNote: jest.fn(() => ({ mutate: jest.fn() })),
  useDeleteNote: jest.fn(() => ({ mutate: jest.fn() })),
}));

describe('Sidebar', () => {
  test('matches snapshot', () => {
    const { asFragment } = renderWithProviders(<Sidebar />);
    expect(asFragment()).toMatchSnapshot();
  });
});
