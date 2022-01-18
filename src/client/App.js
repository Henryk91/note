/* eslint-disable react/prop-types */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable no-alert */
/* eslint-disable max-len */
/* eslint-disable no-unused-expressions */
import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';
import { Home, SearchBar, NoteDetail, NoteDetailPage, NewNote, Login, Pomodoro, Memento } from './views/Components/index';
import { getMyNotesRec, saveNewNote, updateOneNoteRec, getAllNotes, getNoteNames } from './views/Helpers/requests';

const compareSort = (a, b) => {
  const nameA = a.heading.toUpperCase();
  const nameB = b.heading.toUpperCase();

  let comparison = 0;
  if (nameA > nameB) {
    comparison = 1;
  } else if (nameA < nameB) {
    comparison = -1;
  }
  return comparison;
};

function isMobileDevice() {
  return typeof window.orientation !== 'undefined' || navigator.userAgent.indexOf('IEMobile') !== -1;
}

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      notes: null,
      filteredNotes: null,
      user: '',
      loginKey: null,
      notesInitialLoad: false,
      noteNames: null,
      theme: 'Dark',
      searchTerm: '',
      freshData: false,
      lastRefresh: null
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
    this.checkLoginState();
    const self = this;
    window.onfocus = function() {
      self.setRedirect();
      const {lastRefresh} = self.state;
      const now = new Date().getTime();
      const minTimeout = 1000 * 60 * 5;
      if((lastRefresh + minTimeout) < now && lastRefresh && self){
        console.log('Refresh', new Date());
        self.setState({lastRefresh: now})
        self.checkLoginState();
      }
      if((lastRefresh + minTimeout) > now && self){
        console.log('Refresh in ', lastRefresh? ((lastRefresh + minTimeout) - now)/1000 : (minTimeout/1000), "seconds");
      }
      if(!lastRefresh && self){
        self.setState({lastRefresh: now})
      } 
     };
  }

  setRedirect = () => {
    return ;
    const path = window.location.pathname;
    if (path === '/') {
      document.location.href = '/notes/main';
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
    getAllNotes(res => {
      res.sort(compareSort);
      this.setState({ notes: res, filteredNotes: res });
    });
  }

  addMainNote(notes){
    if(notes && notes.length){
      let subs = [];
      notes.forEach(note => {
        if(note.heading.startsWith('Sub: ')){
          subs.push(note)
          return false
        } 
        return true
      })

      if(subs.length > 0){
        const headings = subs.map(sub => {
          return {tag: sub.heading, data: `href:${sub.id}`}
        })
        const subItems = {createdBy: subs[0].createdBy, dataLable: headings, heading: "Z Sub Directories", id: "subs"}
        if (notes) notes.push(subItems)
      }

      if(notes[notes.length-1].id !== 'main'){
        const mainPage = {
          createdBy: "Main",
          dataLable: [...notes].map(note => {
            return {tag: note.heading, data: 'href:' + note.id}
          }), 
          heading: "Main",
          id: "main",
        }
        notes.push(mainPage)
      }
      
      return notes
    }
  }

  getMyNotes(noteName) {
    let { user } = this.state;
    if (noteName) user = noteName;

    if (user !== '') {
      localStorage.setItem('user', user);
      const data = localStorage.getItem(user);
      if (data && data[0] && data.length > 0) {
        const pdata = this.addMainNote(JSON.parse(data));
        if (this.state.notes !== pdata) {
          this.setState({ notes: pdata, filteredNotes: pdata, freshData:false });
        } else {
          this.setState({ freshData:false });
        }
      }

      getMyNotesRec(user, res => {
        res = this.addMainNote(res)
        if (res.length > 0) {
          res.sort(compareSort);
          console.log('Fresh Data')
          this.setState({ freshData:true });
        }

        const stateNotes = this.state.notes;
        const reRender = res && stateNotes ? JSON.stringify(res) !== JSON.stringify(stateNotes) : res.length > 0;
        if (reRender && res.length > 0) {
          localStorage.setItem(user, JSON.stringify(res));
          this.setState({ notes: res, filteredNotes: res });
          this.setRedirect();
        }
      });
    } else {
      // alert('Please add username at the top');
    }
  }

  setFilterNote(val) {
    const { user } = this.state;
    if (user !== val.user) {
      this.getMyNotes(val.user);
    }
    this.setState({ filteredNotes: val.filteredNotes, user: val.user, searchTerm: val.searchTerm });
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
      getNoteNames(res => {
        if (res.length > 0) {
          res.push('All');
          res.push('None');
          if (res && res.length > 0) {
            localStorage.setItem('notenames', JSON.stringify(res));
            this.setState({ noteNames: res });
          }
        }
      });
    }
  }

  updateNote = update => {
    const { notes, searchTerm } = this.state;
    const index = notes.indexOf(val => val.id === update.id);
    notes[index] = update;

    if (searchTerm === '') {
      const person = update.updateData? update.updateData: update.person? update.person: update;
      updateOneNoteRec({ person: person, delete: update.delete }, () => {
        if (update.delete) {
          const noteUser = localStorage.getItem('user');
          this.getMyNotes(noteUser);
        }
      });
    } else {
      alert('Cant update in search');
    }
  };

  addNewNote = newNote => {
    const { notes, user, searchTerm } = this.state;
    const usedNewNote = newNote;
    user !== '' ? (usedNewNote.note.createdBy = user) : null;
    let updatedNote = [];

    if (notes) {
      updatedNote = [...notes, usedNewNote.note];
    } else {
      updatedNote = [usedNewNote.note];
    }
    if (searchTerm === '') {
      saveNewNote(usedNewNote.note, () => alert('setn'));
      this.setState({ notes: updatedNote, filteredNotes: updatedNote });
    } else {
      alert('Cant update in search');
    }
  };

  noteDetailSet = msg => {
    if (msg.noteName) {
      const { noteName } = msg;
      this.setState({ user: noteName, notes: null, filteredNotes: null });
      this.getMyNotes(noteName);
    } else if (msg.noteTheme) {
      this.setState({ theme: msg.noteTheme });
    } else {
      this.updateNote(msg);
    }
  };

  checkLoginState() {
    console.log('checkLoginState');
    const loginKey = localStorage.getItem('loginKey');
    const user = localStorage.getItem('user');
    user !== null ? this.setState({ user }) : null;
    if (loginKey !== null) {
      this.setState({ loginKey });
      this.getNoteNames(loginKey);

      this.getNotesOnLoad(loginKey, user);
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        this.setState({ theme: savedTheme });
      }
    }
  }

  menuButton(event) {
    if(document.location.pathname.includes('note-names')){
      event.preventDefault();
      window.history.back();
      this.checkLoginState();
    } 
  }

  render() {
    const { theme, notes, user, searchTerm, filteredNotes, loginKey, freshData } = this.state;

    const { noteNames } = this.state;
    const themeBack = `${theme.toLowerCase()}-back`;

    let menuButton = document.getElementById('menuButton');
    if(menuButton){
      if(freshData){
        menuButton.style.color = '#ffffff';
      } else {
        menuButton.style.color = '#ffa500';
      }
    }
    if (!document.location.pathname.includes('note-names') && isMobileDevice()) {
      // document.documentElement.webkitRequestFullscreen();
    }

    if (theme === 'Green') {
      document.body.style.backgroundColor = '#103762';
      document.querySelector('meta[name="theme-color"]').setAttribute('content', '#103762');
    }
    if (theme === 'Red') {
      document.body.style.backgroundColor = '#030303';
      document.querySelector('meta[name="theme-color"]').setAttribute('content', '#d00000');
    }
    if (theme === 'Ocean') {
      document.body.style.backgroundColor = '#35373D';
      document.querySelector('meta[name="theme-color"]').setAttribute('content', '#38cdb8');
    }
    if (theme === 'Dark') {
      document.body.style.backgroundColor = '#061f2f';
      document.querySelector('meta[name="theme-color"]').setAttribute('content', '#0090c8');
    }
    if (theme === 'Night') {
      document.body.style.backgroundColor = '#061f2f';
      document.querySelector('meta[name="theme-color"]').setAttribute('content', '#27343b');
    }
    return (
      <Router>
        {loginKey ? (
          <div>
            <header>
              <SearchBar set={this.setFilterNote} noteName={user} Theme={theme} notes={notes} />
              <nav className="bigScreen" id="links">
                <Link style={{ textDecoration: 'none' }} className={`dark-hover ${themeBack}`} onClick={(e) => {this.menuButton(e)}} id="menuButton" to="/notes/note-names">
                  <i className="fas fa-bars " />
                </Link>
              </nav>
            </header>
            <Route exact path="/all" component={props => <Home {...props} SearchTerm={searchTerm} Theme={theme} notes={notes} />} />
            <Route
              exact
              path="/index.html"
              component={props => (
                <Home SearchTerm={searchTerm} noteNames={noteNames} User={user} Theme={theme} {...props} notes={filteredNotes} />
              )}
            />
            <Route
              exact
              path="/"
              component={props => (
                <Home SearchTerm={searchTerm} noteNames={noteNames} User={user} Theme={theme} {...props} notes={filteredNotes} />
              )}
            />
            <Route
              exact
              path="/notes/:id"
              render={props => (
                <NoteDetailPage SearchTerm={searchTerm} noteNames={noteNames} Theme={theme} {...props} set={this.noteDetailSet} notes={notes} />
              )}
            />
            <Route exact path="/new-note" component={() => <NewNote Theme={theme} set={this.addNewNote} />} />
            <Route exact path="/pomodoro" component={() => <Pomodoro />} />
            <Route exact path="/memento" component={() => <Memento Theme={theme} />} />
          </div>
        ) : (
          <Login Theme={theme} />
        )}
      </Router>
    );
  }
}
