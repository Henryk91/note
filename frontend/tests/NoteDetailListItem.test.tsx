import React from 'react';
import { renderWithProviders } from '../src/test-utils';
import { NoteDetailListItem } from '../src/features/notes/components/NoteDetail/forms';

describe('NoteDetailListItem', () => {
  test('matches snapshot', () => {
    const props = {
      item: { name: 'Item', check: false, date: null, time: null, children: [] },
      index: 0,
      deleteItemHandler: jest.fn(),
      changeDate: jest.fn(),
      setEditState: jest.fn(),
      dateToInputDisplayDate: jest.fn(),
      dateInputRef: { current: null },
    } as any;
    const { asFragment } = renderWithProviders(<NoteDetailListItem {...props} />);
    expect(asFragment()).toMatchSnapshot();
  });
});
