import React, { Component } from 'react';

export default class SearchBar extends Component {
  constructor(props) {
    super(props);
    this.state = { showSearch: false, title2: '', title: '', editName: false };
    this.search = this.search.bind(this);
    this.clearSearch = this.clearSearch.bind(this);
    this.toggleSearch = this.toggleSearch.bind(this);
    this.toggleEditName = this.toggleEditName.bind(this);
    this.editNameClick = this.editNameClick.bind(this);
  }

  componentDidUpdate(prevProps) {
    const { noteName } = this.props;
    if (prevProps.noteName !== noteName) {
      this.setState({ title2: noteName });
    }
  }

  toggleSearch = () => {
    const { showSearch } = this.state;
    const save = { showSearch: !showSearch };
    if (this.title2) save.title2 = this.title2.value;
    if (this.title) save.title = this.title.value;
    this.setState({ ...save });
  };

  toggleEditName = () => {
    const { editName } = this.state;
    this.setState({ editName: !editName });
  };

  editNameClick = () => {
    this.toggleEditName();
    setTimeout(() => {
      document.getElementById('userNameBox').focus();
    }, 100);
  };

  clearSearch = () => {
    const { notes, set } = this.props;
    const { title2 } = this.state;
    this.title.value = null;
    set({
      filteredNotes: notes,
      user: this.title2?.value ? this.title2?.value : title2,
      searchTerm: null,
    });
  };

  search = () => {
    const { set } = this.props;
    let { notes } = this.props;
    const { title2 } = this.state;
    if (notes && this.title) {
      const searchTerm = this.title.value;
      notes = notes.filter((val) => {
        const firtName = val.heading.toLowerCase();
        const term = searchTerm.toLowerCase();
        return firtName.includes(term);
      });
    }
    if (this.title2) localStorage.setItem('user', this.title2.value);
    const searchTerm = this.title ? this.title.value.toLowerCase() : null;
    set({
      filteredNotes: notes,
      user: this.title2?.value ? this.title2?.value : title2,
      searchTerm,
    });
  };

  render() {
    const { noteName, Theme } = this.props;
    const { showSearch, editName } = this.state;
    const themeBack = `${Theme.toLowerCase()}-back`;
    const searching = !!(this.title && this.title.value);
    if (noteName && this.title2) {
      this.title2.value = noteName;
    }

    return (
      <header className={themeBack}>
        {showSearch === false && editName === false && (
          <div
            className={themeBack}
            id="userNameBox"
            aria-label="User Name"
            onClick={() => this.editNameClick()}
          >
            {' '}
            {noteName}{' '}
          </div>
        )}
        {showSearch === false && editName === true && (
          <input
            className={themeBack}
            id="userNameBox"
            type="text"
            ref={(c) => (this.title2 = c)}
            aria-label="User Name"
            onKeyUp={this.search}
            defaultValue={noteName}
            placeholder="Add Note Name"
            onBlur={() => this.toggleEditName()}
          />
        )}
        {showSearch === true && (
          <div className="search-box">
            <input
              className={themeBack}
              id="searchBox"
              aria-label="Search Name"
              onKeyUp={this.search}
              type="text"
              ref={(c) => (this.title = c)}
              placeholder="Search..."
            />
          </div>
        )}

        {searching ? (
          <div className="search-clear" onClick={() => this.clearSearch()}>
            <i className="fas fa-times" />
          </div>
        ) : (
          <div className="search-clear" onClick={() => this.toggleSearch()}>
            <i className="fas fa-search" />
          </div>
        )}
      </header>
    );
  }
}
