import React from 'react';
import { renderWithProviders } from '../src/test-utils';
import AutoCompleteTextArea from '../src/features/notes/components/EditNoteCheck/AutoCompleteTextArea';

describe('AutoCompleteTextArea', () => {
  test('matches snapshot', () => {
    const { asFragment } = renderWithProviders(
      <AutoCompleteTextArea elementId="test-id" className="test-class" smallClassName="small" bigClassName="big" />,
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
