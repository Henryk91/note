import React from 'react';
import { renderWithProviders } from '../src/test-utils';
import { LogHeader } from '../src/features/notes/components/NoteDetail/forms';

describe('LogHeader', () => {
  test('matches snapshot', () => {
    const props = {
      continueData: { check: false, date: null, time: null, children: [] },
      onDateBackForward: jest.fn(),
      onContinueLog: jest.fn(),
    } as any;
    const { asFragment } = renderWithProviders(<LogHeader {...props} />);
    expect(asFragment()).toMatchSnapshot();
  });
});
