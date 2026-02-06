import React from 'react';
import { renderWithProviders } from '../src/test-utils';
import { FolderList } from '../src/features/notes/components/NoteDetail/forms';

describe('FolderList', () => {
  test('matches snapshot', () => {
    const props = {
      linkBorder: 'link-border',
      prop: 'Folder Name',
      contentCount: 5,
      onShowHide: jest.fn(),
      onShowLogDays: jest.fn(),
      onShowLogTag: jest.fn(),
      onChangeDate: jest.fn(),
    };
    const { asFragment } = renderWithProviders(<FolderList {...props} />);
    expect(asFragment()).toMatchSnapshot();
  });
});
