import React from 'react';
import { renderWithProviders } from '../src/test-utils';
import NoteItem from '../src/features/notes/components/NoteItem/NoteItem';
import * as useNoteItemLogic from '../src/features/notes/hooks/useNoteItemLogic';

jest.mock('marked', () => ({
  marked: Object.assign((text: string) => text, {
    setOptions: jest.fn(),
    parse: (text: string) => text,
  }),
}));

jest.mock('../src/features/notes/hooks/useNoteItemLogic', () => ({
  useNoteItemLogic: jest.fn(),
}));

describe('NoteItem', () => {
  test('matches snapshot', () => {
    (useNoteItemLogic.useNoteItemLogic as jest.Mock).mockReturnValue({
      item: { content: { data: 'Test Data', date: '2021-01-01' } },
      editingItem: false,
      setEditState: jest.fn(),
      closeEdit: jest.fn(),
      submitChange: jest.fn(),
      deleteItemHandler: jest.fn(),
      changeDate: jest.fn(),
      dateToInputDisplayDate: jest.fn(),
      dateInputRef: { current: null },
    });

    const props = {
      item: { id: '1', content: { data: 'Test', date: '2021-01-01' } },
      show: true,
      index: 0,
      type: 'Note',
      set: jest.fn(),
    } as any;

    const { asFragment } = renderWithProviders(<NoteItem {...props} />);
    expect(asFragment()).toMatchSnapshot();
  });
});
