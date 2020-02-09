/* eslint-disable max-len */
/* eslint-disable no-return-assign */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/prop-types */
import React, { Component } from 'react';

export default class SearchBar extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.search = this.search.bind(this);
    this.clearSearch = this.clearSearch.bind(this)
  }

  search = () => {
    let { notes } = this.props;
    if (notes) {
      const searchTerm = this.title.value;
      notes = notes.filter(val => {
        const firtName = val.heading.toLowerCase();
        const term = searchTerm.toLowerCase();
        return firtName.includes(term);
      });
    }
    localStorage.setItem('user', this.title2.value);
    this.props.set({ filteredNotes: notes, user: this.title2.value, searchTerm: this.title.value.toLowerCase() });
  };
  clearSearch = () => {
    let { notes } = this.props;
    this.title.value = null;
    this.props.set({ filteredNotes: notes, user: this.title2.value, searchTerm: null });
  }

  render() {
    const { noteName, Theme } = this.props;
    const themeBack = `${Theme.toLowerCase()}-back`;
    let searching = this.title && this.title.value ? true: false;
    if (noteName && this.title2) {
      this.title2.value = noteName;
    }
    return (
      <header className={themeBack}>
        <input
          className={themeBack}
          id="userNameBox"
          type="text"
          ref={c => (this.title2 = c)}
          aria-label="User Name"
          onKeyUp={this.search}
          defaultValue={noteName}
          placeholder="Add Note Name"
        />
        <br />
        <div className="search-box">
        <input
          className={themeBack}
          id="searchBox"
          aria-label="Search Name"
          onKeyUp={this.search}
          type="text"
          ref={c => (this.title = c)}
          placeholder="Search..."
        />
          {searching ? <div  className="search-clear" onClick={() => this.clearSearch()}>
            <i className="fas fa-times" />
          </div> : null}
        </div>
        <br />
        <br />
      </header>
    );
  }
}
