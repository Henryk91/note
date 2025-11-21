import React, { Component } from 'react';
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
  getAllNotes,
  getNoteNames,
} from './views/Helpers/requests';

import { compareSort } from './views/Helpers/utils';

function ProtectedRoutes({ children }) {
  const loginKey = localStorage.getItem('loginKey');
  if (!loginKey) return <Redirect to="/login" />;
  return children;
}

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      notes: null,
      user: '',
      notesInitialLoad: false,
      noteNames: null,
      theme: 'Dark',
      searchTerm: '',
      freshData: false,
      lastRefresh: null,
    };
    this.addNewNote = this.addNewNote.bind(this);
    this.updateNote = this.updateNote.bind(this);
    this.noteDetailSet = this.noteDetailSet.bind(this);
    this.setFilterNote = this.setFilterNote.bind(this);
    this.getMyNotes = this.getMyNotes.bind(this);
    this.getNotesOnLoad = this.getNotesOnLoad.bind(this);
    this.getAllNotes = this.getAllNotes.bind(this);
    this.getNoteNames = this.getNoteNames.bind(this);
    this.checkLoginState = this.checkLoginState.bind(this);
    this.setRedirect();
  }

  componentDidMount() {
    console.log('componentDidMount');
    this.setRedirect();
    this.checkLoginState();
    const self = this;
    window.onfocus = function () {
      self.setRedirect();
      const { lastRefresh } = self.state;
      const now = new Date().getTime();
      const minTimeout = 1000 * 60 * 5;
      if (lastRefresh + minTimeout < now && lastRefresh && self) {
        console.log('Refresh', new Date());
        self.setState({ lastRefresh: now });
        self.checkLoginState();
      }
      if (lastRefresh + minTimeout > now && self) {
        console.log(
          'Refresh in ',
          lastRefresh
            ? (lastRefresh + minTimeout - now) / 1000
            : minTimeout / 1000,
          'seconds',
        );
      }
      if (!lastRefresh && self) {
        self.setState({ lastRefresh: now });
      }
    };
  }

  setRedirect = () => {
    const path = window.location.pathname;
    if (path === '/' || window.location.href.includes('index.html')) {
      const { notes, noteNames } = this.state;
      const user = localStorage.getItem('user');
      if ((notes && noteNames) || user)
        window.history.pushState('', '', './notes/main');
    }
  };

  getNotesOnLoad(loggedIn, user) {
    const { notesInitialLoad } = this.state;
    if (!notesInitialLoad) {
      if (loggedIn && !notesInitialLoad && user !== '') {
        this.getMyNotes(user);
        this.setState({ notesInitialLoad: true });
      }
    }
  }

  getAllNotes() {
    getAllNotes((res) => {
      res.sort(compareSort);
      this.setState({ notes: res });
    });
  }

  getMyNotes(noteName) {
    const { notes } = this.state;
    let { user } = this.state;
    if (noteName) user = noteName;

    if (user !== '') {
      localStorage.setItem('user', user);
      const data = localStorage.getItem(user);
      if (data && data[0] && data.length > 0) {
        const pdata = this.addMainNote(JSON.parse(data));
        if (notes !== pdata) {
          this.setState({
            notes: pdata,
            freshData: false,
          });
        } else {
          this.setState({ freshData: false });
        }
      }

      getMyNotesRec(user, (resp) => {
        let res = resp;
        res = this.addMainNote(resp);
        if (res && res.length > 0) {
          res.sort(compareSort);
          console.log('Fresh Data');
          this.setRedirect();
          this.setState({ freshData: true });
        }

        const stateNotes = notes;
        const reRender =
          res && stateNotes
            ? JSON.stringify(res) !== JSON.stringify(stateNotes)
            : res && res.length > 0;
        if (reRender && res.length > 0) {
          localStorage.setItem(user, JSON.stringify(res));
          this.setState({ notes: res });
          this.setRedirect();
        }
      });
    }
  }

  setFilterNote(val) {
    const { user } = this.state;
    if (user !== val.user) {
      this.getMyNotes(val.user);
    }
    this.setState({
      user: val.user,
      searchTerm: val.searchTerm,
    });
  }

  getNoteNames(loginKey) {
    const { notesInitialLoad } = this.state;
    const { noteNames } = this.state;

    let savedNames = localStorage.getItem('notenames');

    if (savedNames) {
      savedNames = JSON.parse(savedNames);
      const { user } = this.state;
      const selectedUser = user.length > 1 ? user : null;
      this.setState({ noteNames: savedNames });
      if (selectedUser) this.getMyNotes(selectedUser);
    }
    if (loginKey && !notesInitialLoad && !noteNames) {
      getNoteNames((res) => {
        if (res.length > 0 && res !== 'No notes') {
          res.push('All');
          res.push('None');
          if (res && res.length > 0) {
            localStorage.setItem('notenames', JSON.stringify(res));
            let update = { noteNames: res };
            if (!localStorage.getItem('user')) {
              // update.user = res[0];
              update = { ...update, user: res[0] };
              this.getMyNotes(res[0]);
            }
            this.setState(update);
          }
        }
      });
    }
  }

  updateNote = (update) => {
    const { notes } = this.state;
    const index = notes.indexOf((val) => val.id === update.id);
    notes[index] = update;

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
      this.getMyNotes(noteUser);
    });
  };

  addNewNote = (newNote) => {
    const { notes, user, searchTerm } = this.state;
    const usedNewNote = newNote;
    if (user !== '') usedNewNote.note.createdBy = user;
    let updatedNote = [];

    if (notes) {
      updatedNote = [...notes, usedNewNote.note];
    } else {
      updatedNote = [usedNewNote.note];
    }

    if (searchTerm === '' || searchTerm === null) {
      saveNewNote(usedNewNote.note, () => alert('setn'));
      this.setState({ notes: updatedNote });
    } else {
      alert('Cant update in search');
    }
  };

  noteDetailSet = (msg) => {
    if (msg.noteName) {
      const { noteName } = msg;
      this.setState({ user: noteName, notes: null });
      this.getMyNotes(noteName);
    } else if (msg.noteTheme) {
      this.setState({ theme: msg.noteTheme });
    } else {
      this.updateNote(msg);
    }
  };

  addMainNote(notes) {
    if (notes && notes.length) {
      const subs = [];
      notes.forEach((note) => {
        if (note.heading.startsWith('Sub: ')) {
          subs.push(note);
          return false;
        }
        return true;
      });

      if (subs.length > 0) {
        const subFound = notes.find((note) => note.id === 'subs');
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
          if (notes) notes.push(subItems);
        }
      }

      if (notes[notes.length - 1].id !== 'main') {
        const mainFound = notes.find((note) => note.id === 'main');
        if (!mainFound) {
          const mainPage = {
            createdBy: 'Main',
            dataLable: [...notes].map((note) => ({
              tag: note.heading,
              data: `href:${note.id}`,
            })),
            heading: 'Main',
            id: 'main',
          };
          notes.push(mainPage);
        }
      }

      return notes;
    }

    return [];
  }

  checkLoginState() {
    console.log('checkLoginState');
    const loginKey = localStorage.getItem('loginKey');
    const user = localStorage.getItem('user');
    if (user !== null) this.setState({ user });
    if (loginKey !== null) {
      this.getNoteNames(loginKey);

      this.getNotesOnLoad(loginKey, user);
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        this.setState({ theme: savedTheme });
      }
    }
  }

  menuButton(event) {
    if (document.location.pathname.includes('note-names')) {
      event.preventDefault();
      window.history.back();
      this.checkLoginState();
    }
  }

  render() {
    const { theme, notes, user, searchTerm, freshData } = this.state;

    const { noteNames } = this.state;
    const themeBack = `${theme.toLowerCase()}-back`;

    const menuButton = document.getElementById('menuButton');
    if (menuButton) {
      if (freshData) {
        menuButton.style.color = '#ffffff';
      } else {
        menuButton.style.color = '#ffa500';
      }
    }

    if (theme === 'Green') {
      document.body.style.backgroundColor = '#103762';
      document
        .querySelector('meta[name="theme-color"]')
        .setAttribute('content', '#103762');
    }
    if (theme === 'Red') {
      document.body.style.backgroundColor = '#030303';
      document
        .querySelector('meta[name="theme-color"]')
        .setAttribute('content', '#d00000');
    }
    if (theme === 'Ocean') {
      document.body.style.backgroundColor = '#35373D';
      document
        .querySelector('meta[name="theme-color"]')
        .setAttribute('content', '#38cdb8');
    }
    if (theme === 'Dark') {
      document.body.style.backgroundColor = '#061f2f';
      document
        .querySelector('meta[name="theme-color"]')
        .setAttribute('content', '#0090c8');
    }
    if (theme === 'Night') {
      document.body.style.backgroundColor = '#061f2f';
      document
        .querySelector('meta[name="theme-color"]')
        .setAttribute('content', '#27343b');
    }

    return (
      <Router>
        <Switch>
          <Route path="/login" render={() => <Login Theme={theme} />} />
          <ProtectedRoutes>
            <header>
              <SearchBar
                set={this.setFilterNote}
                noteName={user}
                Theme={theme}
                notes={notes}
              />
              <nav className="bigScreen" id="links">
                <Link
                  style={{ textDecoration: 'none' }}
                  className={`dark-hover ${themeBack}`}
                  onClick={(e) => {
                    this.menuButton(e);
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
              render={(props) => (
                <Home
                  {...props}
                  SearchTerm={searchTerm}
                  Theme={theme}
                  notes={notes}
                />
              )}
            />
            <Route
              exact
              path="/index.html"
              render={(props) => (
                <NoteDetailPage
                  SearchTerm={searchTerm}
                  noteNames={noteNames}
                  Theme={theme}
                  {...props}
                  set={this.noteDetailSet}
                  notes={notes}
                />
              )}
            />
            <Route
              exact
              path="/"
              render={(props) => (
                <NoteDetailPage
                  SearchTerm={searchTerm}
                  noteNames={noteNames}
                  Theme={theme}
                  {...props}
                  set={this.noteDetailSet}
                  notes={notes}
                />
              )}
            />
            <Route
              exact
              path="/notes/:id"
              render={(props) => (
                <NoteDetailPage
                  SearchTerm={searchTerm}
                  noteNames={noteNames}
                  Theme={theme}
                  {...props}
                  set={this.noteDetailSet}
                  notes={notes}
                />
              )}
            />
            <Route
              exact
              path="/new-note"
              render={() => <NewNote Theme={theme} set={this.addNewNote} />}
            />
            <Route exact path="/pomodoro" render={() => <Pomodoro />} />
            <Route
              exact
              path="/memento"
              render={() => <Memento Theme={theme} />}
            />
          </ProtectedRoutes>
        </Switch>
      </Router>
    );
  }
}
