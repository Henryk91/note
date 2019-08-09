import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { EditNoteCheck } from '../index';
import { NoteItem } from '../index';
import { getNote } from '../../Helpers/requests';
export default class NoteDetail extends Component {
  constructor(props) {
    super(props);
    this.state = {
      person: null,
      showItem: false,
      showAddItem: false,
      editName: false,
      number: null,
      email: null,
      tags: null,
      showTag: '',
      displayDate: new Date()
    };
    this.addItem = this.addItem.bind(this);
    this.submitNewItem = this.submitNewItem.bind(this);
    this.getNoteByTag = this.getNoteByTag.bind(this);
    this.editNameBox = this.editNameBox.bind(this);
    this.showTagChange = this.showTagChange.bind(this);
    this.showHideBox = this.showHideBox.bind(this);
    this.showNoteNames = this.showNoteNames.bind(this);
    this.showNoteThemes = this.showNoteThemes.bind(this);
    this.getSingleNote = this.getSingleNote.bind(this);
    this.editNameSet = this.editNameSet.bind(this);
    this.showAddItemSet = this.showAddItemSet.bind(this);
    this.setNoteTheme = this.setNoteTheme.bind(this);
  }

  componentDidMount() {
    let person = null;

    if (this.props.match) {
      // this.getSingleNote(this.props.match.params.id);
      person = getPerson(this.props.notes, this.props.match);
      this.refreshItems(person);
    }
  }

  getSingleNote(noteHeading) {
    let user = localStorage.getItem('user');
    if (user !== '') {
      getNote(user, noteHeading, res => {
        if (res.length > 0) {
          this.refreshItems(res[0]);
        }
      });
    } else {
      alert('Please add username at the top');
    }
  }

  refreshItems = person => {
    if (person) {
      let tags = this.getNoteByTag(person.dataLable);
      this.setState({ person, tags });
    }
  };

  submitNewItem = event => {
    event.preventDefault();
    let person = this.state.person;
    let number = event.target.number.value;
    let tag = event.target.tagType.value;

    let textTag = event.target.tagTypeText.value;

    tag === 'Note' ? (tag = textTag) : tag;

    if (tag === 'Log') {
      number = JSON.stringify({ json: true, date: textTag, data: number });
    }

    person.dataLable.push({ tag: tag, data: number });
    this.props.set({ person });

    this.refreshItems(person);
    this.setState({ showAddItem: false });
  };

  addItem() {
    let themeBack = this.props.Theme.toLowerCase() + "-back";
    let themeHover = this.props.Theme.toLowerCase() + "-hover";
    return (
      <form onSubmit={this.submitNewItem}>
        <EditNoteCheck Theme={this.props.Theme} showTag={this.state.showTag} />
        <br />
        <button className={`submit-button ${themeHover} ${themeBack}`} type="submit">
          <i className="fas fa-check" />
        </button>
        <button className={`submit-button ${themeHover} ${themeBack}`} onClick={() => this.setState({ showAddItem: false })}>
          {' '}
          <i className="fas fa-times" />{' '}
        </button>
        <br />
      </form>
    );
  }

  updateNoteItem = val => {
    let person = this.state.person;
    let index = person.dataLable.findIndex(item => item.tag === val.type && item.data === val.oldItem);
    if (!val.delete) {
      person.dataLable[index].data = val.item;
    } else {
      person.dataLable.splice(index, 1);
    }
    this.props.set({ person });
  };

  submitNameChange = e => {
    e.preventDefault();
    let heading = e.target.heading.value;
    let person = this.state.person;
    person.heading = heading;

    this.setState({ person, editName: false });
    this.props.set({ person });
  };

  changeDate = e => {
    e.preventDefault();
    let selectedDate = e.target.value;

    if (!selectedDate) selectedDate = new Date();

    this.setState({ displayDate: selectedDate });
  };

  editNameBox(heading) {
    let themeBack = this.props.Theme.toLowerCase() + "-back";
    let themeHover = this.props.Theme.toLowerCase() + "-hover";
    return (
      <form onSubmit={this.submitNameChange}>
        <br />
        <input className={`changeNameHeading ${themeHover} ${themeBack}`}  name="heading" type="text" defaultValue={heading} />
        <br />
        <br />
        <button className={`submit-button ${themeHover} ${themeBack}`} type="submit">
          {' '}
          <i className="fas fa-check" />
        </button>
        <button className={`submit-button ${themeHover} ${themeBack}`} type="submit">
          {' '}
          <i className="fas fa-times" />
        </button>
        <br />
        <br />
      </form>
    );
  }

  showTagChange = tagName => {
    let person = this.state.person;
    this.setState({ showTag: tagName });
    let tags = this.getNoteByTag(person.dataLable, tagName);
    this.setState({ person, tags });
  };

  showNoteNames = names => {
    if (!names) return;

    return names.map(name => {
      return (
        <Link key={name} style={{ textDecoration: 'none' }} to="/" title="Note List">
          <div className="listNameButton" onClick={() => this.props.set({ noteName: name })}>
            <h3> {name} </h3>
          </div>
        </Link>
      );
    });
  };

  setNoteTheme = (name) => {
    this.props.set({ noteTheme: name });
    console.log("XXXXXXXXXXX",name)
    localStorage.setItem('theme',name);
  }

  showNoteThemes = (names) => {
    return names.map(name => {
      return (
        <Link key={name} style={{ textDecoration: 'none' }} to="/" title="Note List">
          <div className="listNameButton" onClick={() => this.setNoteTheme(name)}>
            <h3> {name} Theme </h3>
          </div>
        </Link>
      );
    });
  };

  showHideBox = (showTag, prop) => {
    if (showTag !== prop && prop !== 'Log') {
      this.showTagChange(prop);
    } else if (showTag !== '' && prop !== 'Log') {
      this.showTagChange('');
    }
  };

  showHideBox = (showTag, prop) => {
    if (showTag !== prop && prop !== 'Log') {
      this.showTagChange(prop);
    } else if (showTag !== '' && prop !== 'Log') {
      this.showTagChange('');
    }
  };

  editNameSet = bVal => {
    this.setState({ editName: bVal });
  };

  showAddItemSet = bVal => {
    this.setState({ showAddItem: bVal });
    if (bVal) window.scrollTo(0, 0);
  };

  getNoteByTag = (items, showTag) => {
    let showItem = this.state.showItem;
    let sort = {};
    items.forEach(tag => {
      sort[tag.tag] ? sort[tag.tag].push(tag.data) : (sort[tag.tag] = [tag.data]);
    });

    let propertyArray = Object.keys(sort).sort();

    if(propertyArray.includes("Log")){
      propertyArray = propertyArray.filter(prop => prop !== "Log");
      propertyArray.unshift("Log")
    }

    let all = propertyArray.map((prop, i) => {
      let themeBack = this.props.Theme.toLowerCase() + "-back";
      let showButton = false;
      let showDateSelector = false;

      if (prop === 'Log') showDateSelector = true;

      let selectedDate = this.state.displayDate;

      if (showTag === prop) {
        showButton = true;
      }

      let bunch = sort[prop].map((item, ind) => {
        return (
          <div key={item + prop + ind}>
            <NoteItem item={item} date={selectedDate} Theme={this.props.Theme} show={showButton} set={this.updateNoteItem} type={prop} index={ind} />
          </div>
        );
      });
      let themeBorder = this.props.Theme.toLowerCase() + "-border-thick";
      let themeHover = this.props.Theme.toLowerCase() + "-hover";
      return (
        <div className="detailedBox" key={prop + i} onClick={() => (showTag !== prop && prop !== 'Log' ? this.showTagChange(prop) : null)}>
          <div className="detailTitleBox dark-hover" onClick={() => this.showHideBox(showTag, prop)}>
            <div className={`listCountBox white-color ${themeBorder}`}> {bunch.length} </div>
            <h3 className="detailBoxTitle white-color">{prop} </h3>
            {
              showDateSelector ? 
              <form className="detailBoxTitle dateSelector" onSubmit={this.changeDate}>
                <input 
                onChange={this.changeDate}
                className={themeBack} 
                type="date" 
                name="dateSelector" />
              </form>
              : ''
            }
            {
              showTag === 'Log' && prop === 'Log' ? 
              <div>
                <button 
                  className={`detailBoxTitleButton ${themeBack} ${themeHover}`}
                  onClick={() => this.showTagChange('')}>
                  Hide
                </button>
              </div>
             : prop === 'Log' ? 
              <div>
                <button 
                  className={`detailBoxTitleButton ${themeBack} ${themeHover}`}
                  onClick={() => this.showTagChange(prop)}>
                  Show
                </button>
              </div>
              : null
             }
          </div>

          {bunch}
        </div>
      );
    });
    return all;
  };

  render() {
    let person = this.state.person;
    const showAddItem = this.state.showAddItem;
    let tags = this.state.tags;
    let editName = this.state.editName;
    let editNameB = null;

    person ? (editNameB = this.editNameBox(person.heading)) : (editNameB = null);

    const isNoteNames = this.props.match.url === '/notes/note-names';
    let noteNameBlock = null;
    let noteThemeBlock = null;
    if (isNoteNames) {
      noteNameBlock = this.showNoteNames(this.props.noteNames);
      noteThemeBlock = this.showNoteThemes(["Red", "Blue"]);
      person = null;
    }
    let themeBack = this.props.Theme.toLowerCase() + "-back";
    let themeHover = this.props.Theme.toLowerCase() + "-hover";
    return (
      <div>
        <Link className={`backButton ${themeBack}`} style={{ textDecoration: 'none' }} to="/" title="Note List">
          <i className="fas fa-arrow-left" />
        </Link>
        {isNoteNames ? (
          <div>
            
            <br /> 
            <h3>Note Book Names</h3>
            {noteNameBlock}
            <br />
            <h3>Themes</h3>
            {noteThemeBlock}
          </div>
        ) : null}
        {person ? (
          <div key={person.id}>
            {editName ? (
              <div>{editNameB}</div>
            ) : (
              <div id="personContainer">
                <h1 id="personHead" className="nameBox">
                  {person.heading}
                </h1>
                {showAddItem ? (
                  ''
                ) : (
                  <div className={`nameBox ${themeHover} ${themeBack}`} id="nameBoxButton" onClick={() => this.editNameSet(true)}>
                    <i className="fas fa-pen" />
                  </div>
                )}
              </div>
            )}

            {showAddItem ? <div> {this.addItem()}</div> : null}
            {tags ? <div> {tags} </div> : null}
            <br />
          </div>
        ) : null}
        {editName ? (
          ''
        ) : (
          <div
            className={`detailAddButton ${themeHover} ${themeBack}`}
            onClick={() => {
              showAddItem ? this.showAddItemSet(false) : this.showAddItemSet(true);
            }}
          >
            <i className="fas fa-plus" />
          </div>
        )}
        <br />
        <br />
        <br />
      </div>
    );
  }
}

const getPerson = (notes, propForId) => {
  if (propForId === 'note-name') {
    return this.props.noteNames;
  }
  return notes ? notes.filter(val => val.id == propForId.params.id)[0] : null;
};
