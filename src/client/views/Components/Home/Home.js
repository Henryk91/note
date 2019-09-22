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
    let themeBack = this.props.Theme.toLowerCase() + '-back';
    let themeHover = this.props.Theme.toLowerCase() + '-hover';
    let theme = this.props.Theme;
    let user = this.props.User;
    return (
      <div id="home1">
        <button
          className={`backButton ${themeBack}`}
          onClick={() => {
            localStorage.removeItem('loginKey'), localStorage.removeItem('user1'), window.location.reload();
          }}
        >
          <i className="fas fa-times" />
        </button>
        {user !== 'None' ? (
          <Link style={{ textDecoration: 'none' }} className={`detailAddButton ${themeHover} ${themeBack}`} to={`/new-note/`}>
            <i className="fas fa-plus" />
          </Link>
        ) : null}
        {list ? (
          <div>
            <br />
            {createList(list, theme)}
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
};

const createList = (notes, theme) => {
  let list = null;

  let themeBorder = theme.toLowerCase() + '-border-thick';
  if (notes) {
    list = notes.map(person => {
      let dataLable = [...person.dataLable].map(lable => (lable = lable.tag));
      let noteCount = dataLable.filter(onlyUnique).length;
      return (
        <Link key={person.id} style={{ textDecoration: 'none' }} to={`/notes/${person.id}`}>
          <div className="listNameButton dark-hover">
            <div className={`listCountBox ${themeBorder}`}> {noteCount} </div>
            <h3>{person.heading}</h3>
          </div>
        </Link>
      );
    });
  }
  return list;
};
