import React, { lazy, Suspense } from 'react';
import { Route, Switch } from 'react-router-dom';
import { ProtectedRoutes } from './ProtectedRoutes';
import { MainLayout } from '../../layouts/MainLayout';
import NoteDetailPage from '../../features/notes/pages/NoteDetailPage/NoteDetailPage';

const Home = lazy(() => import('../../features/notes/pages/Home/Home'));
const NewNote = lazy(() => import('../../features/notes/pages/NewNote/NewNote'));
const Login = lazy(() => import('../../features/auth/pages/Login/Login'));
const Pomodoro = lazy(() => import('../../features/pomodoro/pages/Pomodoro/Pomodoro'));
const Memento = lazy(() => import('../../features/memento/pages/Memento/Memento'));

type AppRoutesProps = {
  setFilterNote: (val: any) => void;
  menuButton: (e: any) => void;
};

export const AppRoutes: React.FC<AppRoutesProps> = ({
  setFilterNote,
  menuButton,
}) => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Switch>
        <Route path="/login" render={() => <Login />} />
        <Route
          path="/"
          render={() => (
            <ProtectedRoutes>
              <MainLayout setFilterNote={setFilterNote} menuButton={menuButton}>
                <Switch>
                  <Route exact path="/all" render={(props: any) => <Home {...props} />} />
                  <Route
                    exact
                    path="/index.html"
                    component={NoteDetailPage}
                  />
                  <Route
                    exact
                    path="/"
                    component={NoteDetailPage}
                  />
                  <Route
                    exact
                    path="/notes/:id"
                    component={NoteDetailPage}
                  />
                  <Route exact path="/new-note" component={NewNote} />
                  <Route exact path="/pomodoro" component={Pomodoro} />
                  <Route exact path="/memento" component={Memento} />
                </Switch>
              </MainLayout>
            </ProtectedRoutes>
          )}
        />
      </Switch>
    </Suspense>
  );
};
