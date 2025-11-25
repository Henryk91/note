import React, { useCallback, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import {
  BrowserRouter as Router,
  Route,
  Link,
  Redirect,
  Switch,
} from 'react-router-dom';
import {
  Home,
  SearchBar,
  NoteDetailPage,
  NewNote,
  Login,
  Pomodoro,
  Memento,
} from './views/Components/index';
import {
  getMyNotesRec,
  saveNewNote,
  updateOneNoteRec,
  getNoteNames,
} from './views/Helpers/requests';

import { compareSort } from './views/Helpers/utils';
import { Note } from './views/Helpers/types';
import { RootState } from '../store';
import { setTheme } from '../store/themeSlice';

type ProtectedRoutesProps = {
  children: React.ReactElement;
};

function ProtectedRoutes({ children }: ProtectedRoutesProps) {
  const loginKey = localStorage.getItem('loginKey');
  if (!loginKey) return <Redirect to="/login" />;
  return children;
}

type AppState = {
  notes: Note[] | null;
  user: string;
  notesInitialLoad: boolean;
  noteNames: string[] | null;
  searchTerm: string;
  freshData: boolean;
  lastRefresh: number | null;
};

type AppProps = {
  theme: string;
  setTheme: (theme: string) => void;
};

const App: React.FC<AppProps> = ({ theme, setTheme }) => {
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [user, setUser] = useState('');
  const [notesInitialLoad, setNotesInitialLoad] = useState(false);
  const [noteNames, setNoteNamesState] = useState<string[] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [freshData, setFreshData] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<number | null>(null);

  const addMainNote = useCallback((currentNotes: Note[]) => {
    if (currentNotes && currentNotes.length) {
      const subs: Note[] = [];
      currentNotes.forEach((note) => {
        if (note.heading.startsWith('Sub: ')) {
          subs.push(note);
          return false;
        }
        return true;
      });

      if (subs.length > 0) {
        const subFound = currentNotes.find((note) => note.id === 'subs');
        if (!subFound) {
          const headings = subs.map((sub) => ({
            tag: sub.heading,
            data: `href:${sub.id}`,
          }));
          const subItems = {
            createdBy: subs[0].createdBy,
            dataLable: headings,
            heading: 'Z Sub Directories',
            id: 'subs',
          };
          currentNotes.push(subItems);
        }
      }

      if (currentNotes[currentNotes.length - 1].id !== 'main') {
        const mainFound = currentNotes.find((note) => note.id === 'main');
        if (!mainFound) {
          const mainPage = {
            createdBy: 'Main',
            dataLable: [...currentNotes].map((note) => ({
              tag: note.heading,
              data: `href:${note.id}`,
            })),
            heading: 'Main',
            id: 'main',
          };
          currentNotes.push(mainPage);
        }
      }

      return currentNotes;
    }

    return [];
  }, []);

  const setRedirect = useCallback(() => {
    const path = window.location.pathname;
    if (path === '/' || window.location.href.includes('index.html')) {
      const storedUser = localStorage.getItem('user');
      if ((notes && noteNames) || storedUser) window.history.pushState('', '', './notes/main');
    }
  }, [noteNames, notes]);

  const getMyNotes = useCallback(
    (noteName?: string | null) => {
      let currentUser = user;
      if (noteName) currentUser = noteName;

      if (currentUser !== '') {
        localStorage.setItem('user', currentUser);
        const data = localStorage.getItem(currentUser);
        if (data && data[0] && data.length > 0) {
          const pdata = addMainNote(JSON.parse(data) as Note[]);
          if (notes !== pdata) {
            setNotes(pdata);
            setFreshData(false);
          } else {
            setFreshData(false);
          }
        }

        getMyNotesRec(currentUser, (resp) => {
          let res = resp;
          res = addMainNote(resp);
          if (res && res.length > 0) {
            res.sort(compareSort);
            setRedirect();
            setFreshData(true);
          }

          const stateNotes = notes;
          const reRender =
            res && stateNotes
              ? JSON.stringify(res) !== JSON.stringify(stateNotes)
              : res && res.length > 0;
          if (reRender && res.length > 0) {
            localStorage.setItem(currentUser, JSON.stringify(res));
            setNotes(res);
            setRedirect();
          }
        });
      }
    },
    [addMainNote, notes, setRedirect, user],
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
    [getMyNotes, notesInitialLoad],
  );

  const setFilterNote = useCallback(
    (val) => {
      if (user !== val.user) {
        getMyNotes(val.user);
      }
      setUser(val.user);
      setSearchTerm(val.searchTerm);
    },
    [getMyNotes, user],
  );

  const getNoteNamesHandler = useCallback(
    (loginKey) => {
      let savedNames = localStorage.getItem('notenames');

      if (savedNames) {
        const savedNoteNames = JSON.parse(savedNames);
        const selectedUser = user.length > 1 ? user : null;
        setNoteNamesState(savedNoteNames);
        if (selectedUser) getMyNotes(selectedUser);
      }
      if (loginKey && !notesInitialLoad && !noteNames) {
        getNoteNames((res) => {
          if (res.length > 0) {
            res.push('All');
            res.push('None');
            if (res && res.length > 0) {
              localStorage.setItem('notenames', JSON.stringify(res));
              let update: any = { noteNames: res };
              if (!localStorage.getItem('user')) {
                update = { ...update, user: res[0] };
                getMyNotes(res[0]);
              }
              setNoteNamesState(update.noteNames);
              if (update.user) setUser(update.user);
            }
          }
        });
      }
    },
    [getMyNotes, noteNames, notesInitialLoad, user],
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
        const noteUser = localStorage.getItem('user');
        getMyNotes(noteUser);
      });
    },
    [getMyNotes],
  );

  const addNewNote = useCallback(
    (newNote) => {
      const usedNewNote = newNote;
      if (user !== '') usedNewNote.note.createdBy = user;
      let updatedNote: Note[] = [];

      if (notes) {
        updatedNote = [...notes, usedNewNote.note];
      } else {
        updatedNote = [usedNewNote.note];
      }

      if (searchTerm === '' || searchTerm === null) {
        saveNewNote(usedNewNote.note);
        setNotes(updatedNote);
      } else {
        alert('Cant update in search');
      }
    },
    [notes, searchTerm, user],
  );

  const noteDetailSet = useCallback(
    (msg) => {
      if (msg.noteName) {
        const { noteName } = msg;
        setUser(noteName);
        setNotes(null);
        getMyNotes(noteName);
      } else if (msg.noteTheme) {
        setTheme(msg.noteTheme);
      } else {
        updateNote(msg);
      }
    },
    [getMyNotes, setTheme, updateNote],
  );

  const checkLoginState = useCallback(() => {
    const loginKey = localStorage.getItem('loginKey');
    const storedUser = localStorage.getItem('user');
    if (storedUser !== null && storedUser !== user) setUser(storedUser);
    if (loginKey !== null) {
      getNoteNamesHandler(loginKey);
      getNotesOnLoad(loginKey, storedUser);
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        setTheme(savedTheme);
      }
    }
  }, [getNoteNamesHandler, getNotesOnLoad, setTheme, user]);

  const menuButton = useCallback(
    (event) => {
      if (document.location.pathname.includes('note-names')) {
        event.preventDefault();
        window.history.back();
        checkLoginState();
      }
    },
    [checkLoginState],
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

  useEffect(() => {
    checkLoginState();
  }, []);

  const themeBack = `${theme.toLowerCase()}-back`;

  return (
    <Router>
      <Switch>
        <Route path="/login" render={() => <Login Theme={theme} />} />
        <ProtectedRoutes>
          <>
            <header>
              <SearchBar set={setFilterNote} noteName={user} Theme={theme} notes={notes} />
              <nav className="bigScreen" id="links">
                <Link
                  style={{ textDecoration: 'none' }}
                  className={`dark-hover ${themeBack}`}
                  onClick={(e) => {
                    menuButton(e);
                  }}
                  id="menuButton"
                  to="/notes/note-names"
                >
                  <i className="fas fa-bars " />
                </Link>
              </nav>
            </header>
            <Route
              exact
              path="/all"
              render={(props) => <Home {...props} searchTerm={searchTerm} Theme={theme} notes={notes} />}
            />
            <Route
              exact
              path="/index.html"
              render={(props) => (
                <NoteDetailPage
                  searchTerm={searchTerm}
                  noteNames={noteNames}
                  Theme={theme}
                  {...props}
                  set={noteDetailSet}
                  notes={notes}
                />
              )}
            />
            <Route
              exact
              path="/"
              render={(props) => (
                <NoteDetailPage
                  searchTerm={searchTerm}
                  noteNames={noteNames}
                  Theme={theme}
                  {...props}
                  set={noteDetailSet}
                  notes={notes}
                />
              )}
            />
            <Route
              exact
              path="/notes/:id"
              render={(props) => (
                <NoteDetailPage
                  searchTerm={searchTerm}
                  noteNames={noteNames}
                  Theme={theme}
                  {...props}
                  set={noteDetailSet}
                  notes={notes}
                />
              )}
            />
            <Route exact path="/new-note" render={() => <NewNote Theme={theme} set={addNewNote} />} />
            <Route exact path="/pomodoro" render={() => <Pomodoro />} />
            <Route exact path="/memento" render={() => <Memento Theme={theme} />} />
          </>
        </ProtectedRoutes>
      </Switch>
    </Router>
  );
};

const mapStateToProps = (state: RootState) => ({
  theme: state.theme.value,
});

const mapDispatchToProps = {
  setTheme,
};

export default connect(mapStateToProps, mapDispatchToProps)(App);
