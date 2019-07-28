import React, { Component } from 'react';
import { Link } from 'react-router-dom';

export default class Home extends Component {
    constructor(props) {
        super(props);
        this.state = {
            notes: null,
            list: null
        }
    }
  
    render() {
        let list = this.props.notes
        let noteNames = this.props.noteNames
        return (
            <div id="home">
                { noteNames ?
                      <Link  id="noteBooksButton" style={{ textDecoration: 'none' }} to={`/notes/note-names`}> Notes 
                    </Link> 
                      : null 
                      }
                {list ?
                    <div>
                      <br />
                      {createList(list)}
                      <br />
                    </div> :
                    <h3>Please add note book name <br /> at the top then click Get Notes</h3>
                }
            </div>
        );
    }
}
const createList = (notes) => {
    let list = null
    if (notes) {
        list = notes.map((person) => {
            return (
                    <Link style={{ textDecoration: 'none' }} to={`/notes/${person.id}`}>
                        <div className="listNameButton" key={person.id}>      
                            <h3>{person.heading}</h3>   
                        </div>  
                    </Link>
                  )
              })
    }
    return list
}
