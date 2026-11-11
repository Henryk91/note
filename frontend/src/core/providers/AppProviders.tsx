import React, { useState } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import '../../shared/styles/toast.css';
import { Toaster } from 'react-hot-toast';
import { store } from '../store';
import { GenericErrorBoundary } from './ErrorBoundary/GenericErrorBoundary';
import { retryUnlessClientError } from '../../shared/utils/Helpers/retryPolicy';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // 30 seconds
            gcTime: 24 * 60 * 60 * 1000, // 24 hours (formerly cacheTime)
            retry: retryUnlessClientError(1),
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
          },
        },
      }),
  );

  const [persister] = useState(() =>
    createAsyncStoragePersister({
      storage: window.localStorage,
      key: 'REACT_QUERY_OFFLINE_CACHE',
    }),
  );

  return (
    <Provider store={store}>
      <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
        <Router>
          <GenericErrorBoundary>
            {children}
            {/* Theme-coloured bar at the top centre, under the header; see shared/styles/toast.css. */}
            <Toaster
              position="top-center"
              containerClassName="app-toaster"
              gutter={8}
              toastOptions={{
                duration: 4000,
                className: 'app-toast',
                style: {},
                success: { duration: 3000, iconTheme: { primary: '#10b981', secondary: '#fff' } },
                error: { duration: 5000, iconTheme: { primary: '#ef4444', secondary: '#fff' } },
              }}
            />
          </GenericErrorBoundary>
        </Router>
      </PersistQueryClientProvider>
    </Provider>
  );
};
