import React, { useCallback, useEffect, useState, lazy, Suspense } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { connect } from 'react-redux';
import { BrowserRouter as Router, Route, Link, Redirect, Switch } from 'react-router-dom';
import { SearchBar, NoteDetailPage } from './views/Components/index';
import {
  saveNewNote,
  updateOneNoteRec,
  getNotesV2WithChildrenByParentId,
  getNotesV2ByParentId,
} from './views/Helpers/requests';

import { compareSort } from './views/Helpers/utils';
import { KeyValue, Note, PageDescriptor } from './views/Helpers/types';
import { RootState } from '../store';
import { setTheme } from '../store/themeSlice';
import { setNotes, setNoteNames, setSelectedNoteName, setPerson, bulkUpdatePerson } from '../store/personSlice';

const Home = lazy(() => import('./views/Components/Home/Home'));
const NewNote = lazy(() => import('./views/Components/NewNote/NewNote'));
const Login = lazy(() => import('./views/Components/Login/Login'));
const Pomodoro = lazy(() => import('./views/Components/Pomodoro/Pomodoro'));
const Memento = lazy(() => import('./views/Components/Memento/Memento'));

type ProtectedRoutesProps = {
  children: React.ReactElement;
};

function ProtectedRoutes({ children }: ProtectedRoutesProps) {
  const loginKey = localStorage.getItem('loginKey');
  if (!loginKey) return <Redirect to="/login" />;
  return children;
}

type AppProps = {
  notes: Note[] | null;
  theme: string;
  noteNames: string[] | undefined;
  selectedNoteName?: string;
  lastPage: PageDescriptor;
  pages: PageDescriptor[];
  reloadLastPage: boolean;
  setTheme: (theme: string) => void;
  setNotes: (notes: Note[] | null) => void;
  setNoteNames: (notes: string[]) => void;
  setSelectedNoteName: (notes: string) => void;
  setPerson: (notes: KeyValue<Note>) => void;
  bulkUpdatePerson: (notes: KeyValue<Note>) => void;
};

const App: React.FC<AppProps> = ({
  theme,
  setTheme,
  notes,
  setNotes,
  noteNames,
  setNoteNames,
  selectedNoteName,
  setSelectedNoteName,
  setPerson,
  lastPage,
  pages,
  bulkUpdatePerson,
  reloadLastPage
}) => {
  const [notesInitialLoad, setNotesInitialLoad] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [freshData, setFreshData] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<number | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  const setRedirect = useCallback(() => {
    const path = window.location.pathname;
    if (path === '/' || window.location.href.includes('index.html')) {
      if ((notes && noteNames) || selectedNoteName) window.history.pushState('', '', './notes/main');
    }
  }, [noteNames, notes, selectedNoteName]);

  const getMyNotes = useCallback(
    (noteName?: string | null) => {
      if (sessionStorage.getItem('loading')) return;
      let currentUser = selectedNoteName;
      if (noteName) currentUser = noteName;

      if (currentUser && currentUser !== '') {
        setLoadingData(true);
        sessionStorage.setItem('loading', 'true');
        getNotesV2WithChildrenByParentId(currentUser, (resp) => {
          bulkUpdatePerson(resp);
          setFreshData(true);
          setLoadingData(false);
          sessionStorage.removeItem('loading');
          if (resp) setRedirect();
        });
      }
    },
    [notes, setRedirect, selectedNoteName, loadingData, setLoadingData]
  );

  const getNotesOnLoad = useCallback(
    (loggedIn, loggedUser) => {
      if (!notesInitialLoad) {
        if (loggedIn && !notesInitialLoad && loggedUser !== '') {
          getMyNotes(loggedUser);
          setNotesInitialLoad(true);
        }
      }
    },
    [getMyNotes, notesInitialLoad, loadingData]
  );

  const setFilterNote = useCallback(
    (val) => {
      if (selectedNoteName !== val.user) {
        getMyNotes(val.user);
      }
      setSelectedNoteName(val.user);
      setSearchTerm(val.searchTerm);
    },
    [getMyNotes, selectedNoteName]
  );

  const getNoteNamesHandler = useCallback(
    (loginKey) => {
      if (loginKey && !notesInitialLoad && !noteNames) {
        getNotesV2ByParentId(undefined, (resp) => {
          const names: string[] = resp?.map((item) => item.name);
          if (names.length) {
            setNoteNames([...names, 'All', 'None']);
            if (!selectedNoteName) {
              setSelectedNoteName(names[0]);
              getMyNotes(names[0]);
            }
          }
        });
      }
    },
    [getMyNotes, noteNames, notesInitialLoad, selectedNoteName, loadingData]
  );

  const updateNote = useCallback(
    (update) => {
      let person = null;
      if (update.updateData) {
        person = update.updateData;
      } else if (update.person) {
        person = update.person;
      } else {
        person = update;
      }
      updateOneNoteRec({ person, delete: update.delete }, () => {
        getMyNotes(selectedNoteName);
      });
    },
    [getMyNotes, selectedNoteName]
  );

  const addNewNote = useCallback(
    (newNote) => {
      const usedNewNote = newNote;
      if (selectedNoteName !== '') usedNewNote.note.createdBy = selectedNoteName;
      let updatedNote: Note[] = [];

      if (notes) {
        updatedNote = [...notes, usedNewNote.note];
      } else {
        updatedNote = [usedNewNote.note];
      }

      if (searchTerm === '' || searchTerm === null) {
        saveNewNote(usedNewNote.note);
        if (updatedNote) setNotes(updatedNote);
      } else {
        alert('Cant update in search');
      }
    },
    [notes, searchTerm, selectedNoteName]
  );

  const noteDetailSet = useCallback(
    (msg) => {
      if (msg.noteName) {
        const { noteName } = msg;
        setSelectedNoteName(noteName);
        getMyNotes(noteName);
      } else {
        updateNote(msg);
      }
    },
    [getMyNotes, setTheme, updateNote]
  );

  const checkLoginState = useCallback(() => {
    const loginKey = localStorage.getItem('loginKey');

    if (loginKey !== null) {
      getNoteNamesHandler(loginKey);
      getNotesOnLoad(loginKey, selectedNoteName);
    }
  }, [getNoteNamesHandler, getNotesOnLoad, setTheme, selectedNoteName]);

  const menuButton = useCallback(
    (event) => {
      if (document.location.pathname.includes('note-names')) {
        event.preventDefault();
        window.history.back();
        checkLoginState();
      }
    },
    [checkLoginState]
  );

  useEffect(() => {
    setRedirect();
    const handleFocus = () => {
      setRedirect();
      const now = new Date().getTime();
      if (!lastRefresh) {
        setLastRefresh(now);
        return;
      }

      const minTimeout = 1000 * 60 * 5;
      if (lastRefresh + minTimeout < now && lastRefresh) {
        setLastRefresh(now);
        checkLoginState();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkLoginState, lastRefresh, setRedirect]);

  useEffect(() => {
    const menuBtn = document.getElementById('menuButton');
    if (menuBtn) {
      if (freshData) {
        menuBtn.style.color = '#ffffff';
      } else {
        menuBtn.style.color = '#ffa500';
      }
    }

    if (theme === 'Green') {
      document.body.style.backgroundColor = '#103762';
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#103762');
    }
    if (theme === 'Red') {
      document.body.style.backgroundColor = '#030303';
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#d00000');
    }
    if (theme === 'Ocean') {
      document.body.style.backgroundColor = '#35373D';
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#38cdb8');
    }
    if (theme === 'Dark') {
      document.body.style.backgroundColor = '#061f2f';
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#0090c8');
    }
    if (theme === 'Night') {
      document.body.style.backgroundColor = '#061f2f';
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#27343b');
    }
  }, [freshData, theme]);

  const getLastPageData = () => {
    if (lastPage?.params.id && lastPage?.params.id !== selectedNoteName && selectedNoteName) {
      getNotesV2WithChildrenByParentId(lastPage?.params.id, (resp) => {
        if (resp) bulkUpdatePerson(resp);
      });
    }
  };

  useEffect(() => {
    sessionStorage.removeItem('loading');
    checkLoginState();
  }, []);

  useEffect(() => {
    getLastPageData();
  }, [lastPage?.params?.id]);

  useEffect(() => {
    if (lastPage?.params.id && notesInitialLoad) {
      getLastPageData();
    }
  }, [reloadLastPage]);

  const themeBack = `${theme.toLowerCase()}-back`;

  return (
    <Router>
      <Suspense fallback={<div>Loading...</div>}>
        <Switch>
          <Route path="/login" render={() => <Login />} />
          <ProtectedRoutes>
            <>
              <header>
                <SearchBar set={setFilterNote} />
                <nav className="bigScreen" id="links">
                  <Link
                    style={{ textDecoration: 'none' }}
                    className={`dark-hover ${themeBack}`}
                    onClick={(e) => menuButton(e)}
                    id="menuButton"
                    to="/notes/note-names"
                  >
                    <FontAwesomeIcon icon={faBars} />
                  </Link>
                </nav>
              </header>
              <Route exact path="/all" render={(props) => <Home {...props} searchTerm={searchTerm} notes={notes} />} />
              <Route
                exact
                path="/index.html"
                render={(props) => <NoteDetailPage searchTerm={searchTerm} {...props} set={noteDetailSet} />}
              />
              <Route
                exact
                path="/"
                render={(props) => <NoteDetailPage searchTerm={searchTerm} {...props} set={noteDetailSet} />}
              />
              <Route
                exact
                path="/notes/:id"
                render={(props) => <NoteDetailPage searchTerm={searchTerm} {...props} set={noteDetailSet} />}
              />
              <Route exact path="/new-note" render={() => <NewNote set={addNewNote} />} />
              <Route exact path="/pomodoro" render={() => <Pomodoro />} />
              <Route exact path="/memento" render={() => <Memento />} />
            </>
          </ProtectedRoutes>
        </Switch>
      </Suspense>
    </Router>
  );
};

const mapStateToProps = (state: RootState) => ({
  theme: state.theme.value,
  notes: state.person.notes,
  noteNames: state.person.noteNames,
  selectedNoteName: state.person.selectedNoteName,
  lastPage: state.person.pages.slice(-1)[0],
  pages: state.person.pages,
  reloadLastPage: state.person.reloadLastPage,
});

const mapDispatchToProps = {
  setTheme,
  setNotes,
  setNoteNames,
  setSelectedNoteName,
  setPerson,
  bulkUpdatePerson,
};

export default connect(mapStateToProps, mapDispatchToProps)(App);
