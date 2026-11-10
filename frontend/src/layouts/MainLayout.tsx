import React from 'react';
import { QuickLogSheet } from '../features/notes/log/QuickLogSheet';
import { AppHeader } from './AppHeader';

type MainLayoutProps = {
  children: React.ReactNode;
  setFilterNote: (val: any) => void;
};

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => (
  <>
    <AppHeader />
    <main className="app-main">{children}</main>
    <QuickLogSheet enabled />
  </>
);
