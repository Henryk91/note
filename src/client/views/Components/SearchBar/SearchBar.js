/* eslint-disable max-len */
/* eslint-disable no-return-assign */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/prop-types */
import React, { Component } from 'react';

export default class SearchBar extends Component {
  constructor(props) {
    super(props);
    this.state = {showSearch: false, title2: '', title: ''};
    this.search = this.search.bind(this);
    this.clearSearch = this.clearSearch.bind(this)
    this.toggleSearch = this.toggleSearch.bind(this)
  }

  search = () => {
    let { notes } = this.props;
    let { title2 } = this.state;
    if (notes && this.title) {
      const searchTerm = this.title.value;
      notes = notes.filter(val => {
        const firtName = val.heading.toLowerCase();
        const term = searchTerm.toLowerCase();
        return firtName.includes(term);
      });
    }
    if(this.title2) localStorage.setItem('user', this.title2.value);
    let searchTerm = this.title? this.title.value.toLowerCase(): null;
    this.props.set({ filteredNotes: notes, user: this.title2?.value? this.title2?.value: title2, searchTerm: searchTerm });
  };
  clearSearch = () => {
    let { notes } = this.props;
    let { title2 } = this.state;
    this.title.value = null;
    this.props.set({ filteredNotes: notes, user: this.title2?.value? this.title2?.value: title2, searchTerm: null });
  }
  toggleSearch = () => {
    const { showSearch } = this.state;
    let save = {showSearch: showSearch? false: true}
    if(this.title2) save['title2'] = this.title2.value
    if(this.title) save['title'] = this.title.value
    this.setState({...save})
  }

  componentDidUpdate(prevProps) {
    if (prevProps.noteName !== this.props.noteName) {
      this.setState({title2: this.props.noteName})
    }
  }

  render() {
    const { noteName, Theme } = this.props;
    const { showSearch } = this.state;
    const themeBack = `${Theme.toLowerCase()}-back`;
    let searching = this.title && this.title.value ? true: false;
    if (noteName && this.title2) {
      this.title2.value = noteName;
    }
    return (
      <header className={themeBack}>
        {showSearch === false ?
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
        :
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
        </div>
        } 
        {searching ? 
          <div  className="search-clear" onClick={() => this.clearSearch()}>
            <i className="fas fa-times" />
          </div> : 
          <div  className="search-clear" onClick={() => this.toggleSearch()}>
            <i className="fas fa-search" />
          </div>
        }
      </header>
    );
  }
}
