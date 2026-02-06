import React from 'react';
import ReactDOM from 'react-dom/client';
import AppContent from './App';
import './app.css';
import './serviceWorker';
import { AppProviders } from './core/providers/AppProviders';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <AppProviders>
      <AppContent />
    </AppProviders>
  </React.StrictMode>,
);
