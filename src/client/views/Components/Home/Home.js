/* eslint-disable no-param-reassign */
/* eslint-disable no-return-assign */
/* eslint-disable no-unused-expressions */
/* eslint-disable react/button-has-type */
/* eslint-disable react/prop-types */
import React, { Component } from 'react';
import { Link } from 'react-router-dom';

const onlyUnique = (value, index, self) => self.indexOf(value) === index;

const createList = (notes, theme) => {
  let list = null;

  const themeBorder = `${theme.toLowerCase()}-border-thick`;  
  let subs = [];
  notes = notes.filter(note => {
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
    const subItems = {createdBy: subs[0].createdBy, dataLable: headings, heading: "Sub Directories", id: "subs"}
    if (notes) notes.push(subItems)
  }
  if (notes) {
    list = notes.map(person => {
      const dataLable = [...person.dataLable].map(dataL => (dataL = dataL.tag));
      const noteCount = dataLable.filter(onlyUnique).length;
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

export default class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.logOut = this.logOut.bind(this);
  }

  logOut = () => {
    localStorage.clear();
    window.location.reload();
  };

  render() {
    const { notes, Theme, User } = this.props;
    const themeBack = `${Theme.toLowerCase()}-back`;
    const themeHover = `${Theme.toLowerCase()}-hover`;
    localStorage.removeItem('saved-pages')
    return (
      <div id="home1">
        <button
          className={`backButton ${themeBack}`}
          onClick={() => {
            this.logOut();
          }}
        >
          <i className="fas fa-times" />
        </button>
        {User !== 'None' ? (
          <div className="detail-scroll">
            <Link style={{ textDecoration: 'none' }} className={`detailAddButton ${themeHover} ${themeBack}`} to="/new-note/">
              <i className="fas fa-plus" />
            </Link>
          </div>
        ) : null}
        {notes ? (
          <div className="slide-in">
            <br />
            {createList(notes, Theme)}
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
