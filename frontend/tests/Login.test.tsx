import React from 'react';
import { renderWithProviders } from '../src/test-utils';
import Login from '../src/features/auth/pages/Login/Login';

describe('Login', () => {
  test('matches snapshot', () => {
    const { asFragment } = renderWithProviders(<Login />);
    expect(asFragment()).toMatchSnapshot();
  });
});
