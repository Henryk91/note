
import React, { Component } from 'react'
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';
import { Home, SearchBar, NoteDetail, NewNote, Login } from './views/Components/index';
import { getMyNotes, saveNewNote, updateNote, getAllNotes, getNoteNames } from '../client/views/Helpers/requests'


export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      notes: null,
      limitNotes: null,
      filteredNotes: null,
      user: '',
      loginKey: null,
      notesInitialLoad: false,
      noteNames: null,
      selectedNoteName: '',
    }
    this.addNewNote = this.addNewNote.bind(this)
    this.updateNote = this.updateNote.bind(this)
    this.noteDetailSet = this.noteDetailSet.bind(this)
    this.setFilterNote = this.setFilterNote.bind(this)
    this.getMyNotes = this.getMyNotes.bind(this)
    this.getNotesOnLoad = this.getNotesOnLoad.bind(this)
    this.getAllNotes = this.getAllNotes.bind(this)
    this.getNoteNames = this.getNoteNames.bind(this)
  }

  componentWillMount() {
    var loginKey = localStorage.getItem("loginKey")
    var user = localStorage.getItem("user")
    user !== null ? this.setState({ user }) : null
    loginKey !== null ? this.setState({ loginKey }) : null
  }

  addNewNote = (val) => {
    let notes = this.state.notes;
    let user = this.state.user;

    user !== '' ? val.note.createdBy = user : null
    let updatedNote = [...notes, val.note]
    saveNewNote(val.note, () => alert("setn"))
    this.setState({ notes: updatedNote, filteredNotes: updatedNote })
  }

  noteDetailSet = (msg) => {
    
    if(msg.noteName){
      
      let noteName = msg.noteName;
      this.setState({user: noteName })
      this.getMyNotes(noteName);
    } else {
      this.updateNote(msg);
    }
  }
  
  updateNote = (update) => {
    let notes = this.state.notes;
    let index = notes.indexOf((val) => val.id === update.id)
    notes[index] = update
    updateNote(update, () => alert("setn"))
    this.setState({ notes, filteredNotes: notes })
  }
  
  getAllNotes(){
    let tempPass = this.state.loginKey
    
     getAllNotes((res) => {
        res.sort(compareSort)
        this.setState({ notes: res, filteredNotes: res })
      })
  }

  getMyNotes(noteName) {
    let user = this.state.user
    
    if(noteName) user = noteName;
    
    let tempPass = this.state.loginKey
    
    if (user !== '') {
      localStorage.setItem("user", user);
      getMyNotes(user, (res) => {
        if(res.length > 0){
          res.sort(compareSort)
        }
        this.setState({ notes: res, filteredNotes: res })
        
      })
    } else {
      alert("Please add username at the top")
    }
  }

  setFilterNote(val) {
    this.setState({ filteredNotes: val.filteredNotes, user: val.user })
  }

  getNoteNames(){
    var loggedIn = this.state.loginKey;
    var user = this.state.user;
    var notesLoaded = this.state.notesInitialLoad
    var noteNames = this.state.noteNames
    if(loggedIn && !notesLoaded && !noteNames){
         getNoteNames((res) => {
            if(res.length > 0){
              res.push('All')
              res.push('None')
              this.setState({noteNames: res})
            }
          })
       }
  }

  getNotesOnLoad(){
    var notesLoaded = this.state.notesInitialLoad
    if(!notesLoaded){
      var loggedIn = this.state.loginKey
      var user = this.state.user
      this.getNoteNames();
      if(loggedIn && !notesLoaded && user !== ''){
        
        this.getMyNotes();
        this.setState({notesInitialLoad: true})
      }
    }
  }

  render() {
    var loggedIn = this.state.loginKey
    let noteNames = this.state.noteNames;
    this.getNotesOnLoad();
    return (
      <Router>
        { loggedIn ? 
        <div>
          <header>
            <SearchBar set={this.setFilterNote} noteName={this.state.user} notes={this.state.notes} />
            <nav className="bigScreen" id="links">
              <Link
                onClick={this.getMyNotes}
                className="navLink"
                to="/"
                title="Note List">
                Get Notes
              </Link>
                <Link
                  id="lastNavLink"
                  className="navLink"
                  to={`/new-note/`}>
                  Add Note
              </Link>
            </nav>
          </header>
            <Route
            exact path='/all'
            component={(props) => <Home {...props} notes={this.state.notes} />}
          />
          <Route
            exact path='/'
            component={(props) => <Home noteNames={noteNames} {...props} notes={this.state.filteredNotes} />}
          />
          <Route
            exact path='/notes/:id'
            render={(props) => <NoteDetail noteNames={noteNames} {...props} set={this.noteDetailSet} notes={this.state.notes} />}
          />
          <Route
            exact path='/new-note'
            component={() => <NewNote set={this.addNewNote} />}
          />
            <button className="logoutButton" onClick={() => {localStorage.removeItem("loginKey"),localStorage.removeItem("user"), window.location.reload()}}>Done</button>
        </div>
          : <Login />}
      </Router>
    )
  }
}


let compareSort = (a, b) => {

  const nameA = a.heading.toUpperCase();
  const nameB = b.heading.toUpperCase();

  let comparison = 0;
  if (nameA > nameB) {
    comparison = 1;
  } else if (nameA < nameB) {
    comparison = -1;
  }
  return comparison;
}