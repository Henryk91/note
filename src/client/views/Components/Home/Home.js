import React, { Component } from 'react';
import { Link } from 'react-router-dom';

export default class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      notes: null,
      list: null
    };
  }

  render() {
    let list = this.props.notes;
    let noteNames = this.props.noteNames;
    return (
      <div id="home1">
        <button
          className="backButton"
          onClick={() => {
            localStorage.removeItem('loginKey'), localStorage.removeItem('user'), window.location.reload();
          }}
        >
          <i className="fas fa-times" />
        </button>
        <Link style={{ textDecoration: 'none' }} className="detailAddButton" to={`/new-note/`}>
          <i className="fas fa-plus" />
        </Link>

        {list ? (
          <div>
            <br />
            {createList(list)}
            <br />
          </div>
        ) : (
          <h3>
            Please add note book name <br /> at the top then click Get Notes
          </h3>
        )}
      </div>
    );
  }
}
const onlyUnique = (value, index, self) => {
  return self.indexOf(value) === index;
}

const createList = notes => {
  let list = null;
  
  if (notes) {
    list = notes.map(person => {

      let dataLable = [...person.dataLable].map(lable => lable = lable.tag)
      let noteCount = dataLable.filter(onlyUnique).length
      return (
        <Link key={person.id} style={{ textDecoration: 'none' }} to={`/notes/${person.id}`}>
          <div className="listNameButton dark-hover" >
            <div className="listCountBox" > { noteCount } </div>
            <h3>{person.heading}</h3>
          </div>
        </Link>
      );
    });
  }
  return list;
};

