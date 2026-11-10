import React, { lazy, Suspense } from 'react';
import { Route, Switch } from 'react-router-dom';
import { ProtectedRoutes } from './ProtectedRoutes';
import { MainLayout } from '../../layouts/MainLayout';
import NoteDetailPage from '../../features/notes/pages/NoteDetailPage/NoteDetailPage';

const Home = lazy(() => import('../../features/notes/pages/Home/Home'));
const NewNote = lazy(() => import('../../features/notes/pages/NewNote/NewNote'));
const Login = lazy(() => import('../../features/auth/pages/Login/Login'));
const Pomodoro = lazy(() => import('../../features/pomodoro/pages/Pomodoro/Pomodoro'));
const RecentlyDeleted = lazy(() => import('../../features/notes/pages/RecentlyDeleted/RecentlyDeleted'));
const Memento = lazy(() => import('../../features/memento/pages/Memento/Memento'));

type AppRoutesProps = {
  setFilterNote: (val: any) => void;
};

export const AppRoutes: React.FC<AppRoutesProps> = ({
  setFilterNote,
}) => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Switch>
        <Route path="/login" render={() => <Login />} />
        <Route
          path="/"
          render={() => (
            <ProtectedRoutes>
              <MainLayout setFilterNote={setFilterNote}>
                <Switch>
                  <Route exact path="/all" render={(props: any) => <Home {...props} />} />
                  <Route
                    exact
                    path={['/', '/index.html', '/notes/:id', '/f/:folderId', '/n/:noteId']}
                    component={NoteDetailPage}
                  />
                  <Route exact path="/new-note" component={NewNote} />
                  <Route exact path="/pomodoro" component={Pomodoro} />
                  <Route exact path="/memento" component={Memento} />
                  <Route exact path="/recently-deleted" component={RecentlyDeleted} />
                </Switch>
              </MainLayout>
            </ProtectedRoutes>
          )}
        />
      </Switch>
    </Suspense>
  );
};
