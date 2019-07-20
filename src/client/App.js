
import React, { Component } from 'react'
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';
import { Home, SearchBar, NoteDetail, NewNote, Login } from './views/Components/index';
import { getMyNotes, saveNewNote, updateNote, getAllNotes } from '../client/views/Helpers/requests'


export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      notes: null,
      limitNotes: null,
      filteredNotes: null,
      user: '',
      loginKey: null,
      notesInitialLoad: false
    }
    this.addNewNote = this.addNewNote.bind(this)
    this.updateNote = this.updateNote.bind(this)
    this.setFilterNote = this.setFilterNote.bind(this)
    this.getMyNotes = this.getMyNotes.bind(this)
    this.getNotesOnLoad = this.getNotesOnLoad.bind(this)
    this.getAllNotes = this.getAllNotes.bind(this)
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

  getMyNotes() {
    let user = this.state.user
    let tempPass = this.state.loginKey
    if (user !== '') {
      
      getMyNotes(user, (res) => {
        if(res.length > 0){
          res.sort(compareSort)
          this.setState({ notes: res, filteredNotes: res })
        }
      })
    } else {
      alert("Please add username at the top")
    }
  }

  setFilterNote(val) {
    this.setState({ filteredNotes: val.filteredNotes, user: val.user })
  }

  getNotesOnLoad(){
    var notesLoaded = this.state.notesInitialLoad
    if(!notesLoaded){
      var loggedIn = this.state.loginKey
      var user = this.state.user
      if(loggedIn && !notesLoaded && user !== ''){
        this.getMyNotes();
        this.setState({notesInitialLoad: true})
      }
    }
  }

  render() {
    var loggedIn = this.state.loginKey
    this.getNotesOnLoad();
    return (
      <Router>
        { loggedIn ? 
        <div>
          <header>
            <SearchBar set={this.setFilterNote} notes={this.state.notes} />
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
            component={(props) => <Home {...props} notes={this.state.filteredNotes} />}
          />
          <Route
            exact path='/notes/:id'
            render={(props) => <NoteDetail {...props} set={this.updateNote} notes={this.state.notes} />}
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