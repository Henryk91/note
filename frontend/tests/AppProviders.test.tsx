import React from 'react';
import { render } from '@testing-library/react';
import { AppProviders } from '../src/core/providers/AppProviders';

jest.mock('react-redux', () => ({
  Provider: ({ children }: any) => <div>{children}</div>,
}));
jest.mock('@tanstack/react-query', () => ({
  QueryClientProvider: ({ children }: any) => <div>{children}</div>,
  QueryClient: jest.fn(),
}));
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: any) => <div>{children}</div>,
}));
jest.mock('@tanstack/react-query-persist-client', () => ({
  PersistQueryClientProvider: ({ children }: any) => <div>{children}</div>,
}));
jest.mock('@tanstack/query-async-storage-persister', () => ({
  createAsyncStoragePersister: jest.fn(),
}));
jest.mock('../src/core/providers/ErrorBoundary/GenericErrorBoundary', () => ({
  GenericErrorBoundary: ({ children }: any) => <div>{children}</div>,
}));

describe('AppProviders', () => {
  test('matches snapshot', () => {
    const { asFragment } = render(
      <AppProviders>
        <div>Child</div>
      </AppProviders>,
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
