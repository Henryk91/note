import React, { Component } from 'react';

export default class SearchBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showSearch: false,
      currentNoteName: '',
      editName: false,
    };
    this.search = this.search.bind(this);
    this.clearSearch = this.clearSearch.bind(this);
    this.toggleSearch = this.toggleSearch.bind(this);
    this.toggleEditName = this.toggleEditName.bind(this);
    this.editNameClick = this.editNameClick.bind(this);
  }

  componentDidUpdate(prevProps) {
    const { noteName } = this.props;
    if (prevProps.noteName !== noteName) {
      this.setState({ currentNoteName: noteName });
    }
  }

  toggleSearch = () => {
    const { showSearch } = this.state;
    const save = { showSearch: !showSearch };
    if (this.currentNoteName) save.currentNoteName = this.currentNoteName;
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
    const { currentNoteName } = this.state;
    set({
      filteredNotes: notes,
      user: currentNoteName,
      searchTerm: null,
    });

    this.setState({ showSearch: false });
  };

  search = (event) => {
    const { set } = this.props;
    let { notes } = this.props;
    const { currentNoteName, showSearch, editName } = this.state;
    const searchTerm = !editName ? event?.target?.value || '' : null;

    const editingName = !showSearch && editName;
    const userName = editingName ? event?.target?.value || '' : currentNoteName;
    if (notes && searchTerm && searchTerm !== '') {
      const term = searchTerm.toLowerCase();
      notes = notes.filter((val) => val.heading.toLowerCase().includes(term));
    }
    if (userName) localStorage.setItem('user', userName);
    set({
      filteredNotes: notes,
      user: userName,
      searchTerm,
    });
  };

  render() {
    const { noteName, Theme } = this.props;
    const { showSearch, editName } = this.state;
    const themeBack = `${Theme.toLowerCase()}-back`;
    const searching = showSearch && !editName;

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
            aria-label="User Name"
            onKeyUp={(e) => this.search(e)}
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
              onKeyUp={(e) => this.search(e)}
              type="text"
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
