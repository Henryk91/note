import React from 'react';
import { renderWithProviders } from '../src/test-utils';
import EditNoteCheck from '../src/features/notes/components/EditNoteCheck/EditNoteCheck';

jest.mock('../src/features/notes/components/EditNoteCheck/NoteInputFields', () => ({
  NewEmailField: () => <div>NewEmailField</div>,
  NewNumberField: () => <div>NewNumberField</div>,
  NewUploadField: () => <div>NewUploadField</div>,
  NewLogField: () => <div>NewLogField</div>,
  NewNoteField: () => <div>NewNoteField</div>,
  NewLinkField: () => <div>NewLinkField</div>,
}));

describe('EditNoteCheck', () => {
  test('matches snapshot', () => {
    const props = {
      item: { name: 'Item', check: false, date: null, time: null, children: [] },
      editingItem: true,
      isNote: true,
      setEditState: jest.fn(),
      closeEdit: jest.fn(),
      submitChange: jest.fn(),
      deleteItemHandler: jest.fn(),
      changeDate: jest.fn(),
      dateToInputDisplayDate: jest.fn(),
      dateInputRef: { current: null },
    } as any;
    const { asFragment } = renderWithProviders(<EditNoteCheck {...props} />);
    expect(asFragment()).toMatchSnapshot();
  });
});
