import React from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';

const ErrorFallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => {
  return (
    <div role="alert" style={{ padding: '20px', border: '1px solid red', margin: '20px' }}>
      <h2>Something went wrong:</h2>
      <pre style={{ color: 'red' }}>{(error as Error).message}</pre>
      <button onClick={resetErrorBoundary} style={{ marginTop: '10px' }}>
        Try again
      </button>
    </div>
  );
};

export const GenericErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
      {children}
    </ErrorBoundary>
  );
};
