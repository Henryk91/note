/* eslint-disable prefer-destructuring */
/* eslint-disable no-nested-ternary */
/* eslint-disable react/button-has-type */
/* eslint-disable react/no-array-index-key */
/* eslint-disable array-callback-return */
/* eslint-disable consistent-return */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable max-len */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-alert */
/* eslint-disable react/prop-types */
/* eslint-disable no-param-reassign */
/* eslint-disable no-return-assign */
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { EditNoteCheck, NoteItem } from '../index';
import { getNote } from '../../Helpers/requests';

const getPerson = (notes, propForId) => {
  if (propForId === 'note-name') {
    return this.props.noteNames;
  }
  return notes && notes[0] ? notes.filter((val) => val.id === propForId.params.id)[0] : null;
};
export default class NoteDetail extends Component {
  constructor(props) {
    super(props);
    this.state = {
      person: null,
      showAddItem: false,
      editName: false,
      tags: null,
      showTag: '',
      addLable: null,
      displayDate: null,
      continueData: null,
      showLogDaysBunch: false,
      searchTerm: '',
      showLink: [''],
    };
    this.addItem = this.addItem.bind(this);
    this.submitNewItem = this.submitNewItem.bind(this);
    this.getNoteByTag = this.getNoteByTag.bind(this);
    this.editNameBox = this.editNameBox.bind(this);
    this.showTagChange = this.showTagChange.bind(this);
    this.showHideBox = this.showHideBox.bind(this);
    this.showNoteThemes = this.showNoteThemes.bind(this);
    this.getSingleNote = this.getSingleNote.bind(this);
    this.editNameSet = this.editNameSet.bind(this);
    this.showAddItemSet = this.showAddItemSet.bind(this);
    this.setNoteTheme = this.setNoteTheme.bind(this);
    this.createNoteItemBunch = this.createNoteItemBunch.bind(this);
    this.showLogDays = this.showLogDays.bind(this);
  }

  componentDidMount() {
    // this.initPage2(this);
    this.initPage3(this);
  }

  initPage2(self) {
    let person = null;
    const { match, notes, initShowtag } = self.props;
    if (initShowtag) {
      person = getPerson(notes, initShowtag);
      if (person) {
        this.refreshItems(person);
      } else if (match) {
        person = getPerson(notes, match);
        this.refreshItems(person);
      }
    } else if (match) {
      if (match.url.includes('subs')) {
        person = this.getSubs(notes);
        this.refreshItems(person);
      } else {
        person = getPerson(notes, match);
        this.refreshItems(person);
      }
    }
  }

  getSubs(notes) {
    let subs = notes.filter((note) => {
      return note.heading.startsWith('Sub: ');
    });

    if (subs.length > 0) {
      const headings = subs.map((sub) => {
        return { tag: sub.heading, data: `href:${sub.id}` };
      });
      return { createdBy: subs[0].createdBy, dataLable: headings, heading: 'Sub Directories', id: 'subs' };
    }
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ searchTerm: nextProps.SearchTerm });
    const self = this;
    setTimeout(() => {
      this.initPage(nextProps, self);
    }, 100);
  }

  initPage(nextProps, self) {
    if (self.props.initShowtag) {
      const person = getPerson(self.props.notes, self.props.initShowtag);
      if (person) {
        this.refreshItems(person);
      } else {
        const person = getPerson(self.props.notes, self.props.match);
        this.props.openPage({ personNext: person });
        self.refreshItems(person);
      }
    } else {
      const person = getPerson(self.props.notes, self.props.match);
      self.refreshItems(person);
    }
    let noteDetailPage = document.getElementById('multiple-pages');
    if (noteDetailPage) noteDetailPage.scrollBy(noteDetailPage.scrollWidth * 2, 0);
  }
  initPage3(self) {
    if (self.props.initShowtag) {
      if (self.props.match.url.includes('subs')) {
        const person = this.getSubs(self.props.notes);
        this.refreshItems(person);
        return
      }
      const person = getPerson(self.props.notes, self.props.initShowtag);
      if (person) {
        this.refreshItems(person);
      } else {
        const person = getPerson(self.props.notes, self.props.match);
        this.props.openPage({ personNext: person });
        self.refreshItems(person);
      }
    } else {
      const person = getPerson(self.props.notes, self.props.match);
      self.refreshItems(person);
    }
    let noteDetailPage = document.getElementById('multiple-pages');
    if (noteDetailPage)
      setTimeout(() => {
        let noteDetailPage = document.getElementById('multiple-pages');
        noteDetailPage.scrollBy(noteDetailPage.scrollWidth * 5, 0);
      }, 300);
  }

  getSingleNote(noteHeading) {
    const user = localStorage.getItem('user');
    if (user !== '') {
      getNote(user, noteHeading, (res) => {
        if (res.length > 0) {
          this.refreshItems(res[0]);
        }
      });
    } else {
      alert('Please add username at the top');
    }
  }

  refreshItems = (person) => {
    if (person) {
      let sessionShowTag = localStorage.getItem('showTag');
      const { showTag } = this.state;
      let tag = sessionShowTag ? sessionShowTag : showTag;
      const tags = this.getNoteByTag(person.dataLable, tag);
      this.setState({ person, tags, showTag: tag });
    }
  };

  submitNewItem = (event) => {
    event.preventDefault();
    const { person } = this.state;

    let number = event.target.number.value;
    let tag = event.target.tagType.value;
    const textTag = event.target.tagTypeText? event.target.tagTypeText.value : '';

    tag === 'Note' || tag === 'Upload' ? (tag = textTag) : tag;

    if (tag === 'Log') {
      number = JSON.stringify({ json: true, date: textTag, data: number });
    }

    if (number.includes(';base64,')) {
      const b64 = number.substring(number.indexOf('base64') + 7);
      console.log(b64);
      number = `${window.atob(b64)}<br />${number}`;
    }

    if(tag === 'Link'){
      const { notes } = this.props
      let link = event.target.links.value;
      console.log('link',link);
      number = 'href:' + link
      const tagName = notes.find(note => note.id === link)
      tag = tagName.heading.startsWith('Sub: ') ? tagName.heading.slice(4).trim(): tagName.heading
    }

    person.dataLable.push({ tag, data: number });

    const updateData = JSON.parse(JSON.stringify(person));
    updateData.dataLable = [{ tag, data: number }];
    this.props.set({ updateData });

    this.refreshItems(person);
    this.setState({ showAddItem: false });
    this.props.hideAddItem({ show: false });

    if(!number.includes('href:')) {
      event.target.number.value = '';
      event.target.tagTypeText.value = '';
    }
  };

  updateNoteItem = (val) => {
    const { person } = this.state;
    const updateData = JSON.parse(JSON.stringify(person));
    updateData.dataLable = [{ tag: val.type, data: val.oldItem, edit: val.item }];
    if (!val.delete) {
      this.props.set({ updateData, edit: val.item });
    } else {
      this.props.set({ updateData, delete: true });
    }
  };

  continueLog = (val) => {
    this.setState({ addLable: val.cont });
    this.showAddItemSet(true);
  };

  submitNameChange = (e) => {
    e.preventDefault();
    const heading = e.target.heading.value;
    const { person } = this.state;
    if (person.heading !== heading) {
      person.heading = heading;
      this.props.set({ person });
    }
    this.setState({ person, editName: false });
  };

  changeDate = (e) => {
    e.preventDefault();
    const selectedDate = e.target.value;
    this.setState({ displayDate: selectedDate });
    this.showTagChange('');
    const self = this;

    setTimeout(() => {
      self.showTagChange('Log');
    }, 200);
  };

  setDate = (prop, date) => {
    if (prop === 'Log Days') {
      this.setState({ displayDate: date, showLogDaysBunch: false });
      this.showTagChange('');
      const self = this;
      setTimeout(() => {
        window.scrollTo(0, 0);
        self.showTagChange('Log');
      }, 200);
    }
  };

  showTagChange = (tagName) => {
    const { person, editName, showTag, showLink } = this.state;
    let lastLink = showLink.length > 1 ? showLink[showLink.length - 1] : null;
    const { notes } = this.props;
    let nextPerson = lastLink ? notes.find((note) => note.id === lastLink) : null;
    const tagData = lastLink
      ? nextPerson.dataLable.find((note) => note.tag === tagName)
      : person.dataLable.find((note) => note.tag === tagName);

    if (tagData && tagData.data && tagData.data.startsWith('href:') && editName === false) {
      // Is link
      this.handleLinkClick(tagData, person, tagName, showLink, lastLink);
    } else if (nextPerson && tagData !== undefined) {
      this.handleLinkInLinkClick(showLink, nextPerson, tagName);
    } else {
      this.noteDetailItemClick(nextPerson, person, tagName);
    }
  };

  setNoteTheme = (name) => {
    this.props.set({ noteTheme: name });
    localStorage.setItem('theme', name);
  };

  showNoteThemes = (names) =>
    names.map((name) => (
      <Link key={name} style={{ textDecoration: 'none' }} to="/" title="Note List">
        <div className="listNameButton" onClick={() => this.setNoteTheme(name)}>
          <h3> {name} Theme </h3>
        </div>
      </Link>
    ));

  showHideBox = (showTag, prop) => {
    if (showTag !== prop && prop !== 'Log') {
      this.showTagChange(prop);
    } else if (showTag !== '' && prop !== 'Log') {
      this.showTagChange('');
    }
  };

  editNameSet = (bVal) => {
    this.setState({ editName: bVal });
  };

  showAddItemSet = (bVal) => {
    this.setState({ showAddItem: bVal });
    if (bVal) window.scrollTo(0, 0);
  };

  dateBackForward = (direction) => {
    let { displayDate } = this.state;
    if (displayDate) {
      var dateObj = new Date(displayDate);
      if (direction === 'back') {
        dateObj.setDate(dateObj.getDate() - 1);
      } else {
        dateObj.setDate(dateObj.getDate() + 1);
      }

      let dateToChangeTo = dateObj + '';
      dateToChangeTo = dateToChangeTo.substring(0, 16).trim();
      this.setDate('Log Days', dateToChangeTo);
    }
  };

  getNoteByTag = (items, showTag) => {
    const sort = {};
    items.forEach((tag) => {
      sort[tag.tag] ? sort[tag.tag].push(tag.data) : (sort[tag.tag] = [tag.data]);
    });

    let { linkProps, propertyArray } = this.setLogAndLinksAtTop(sort);

    const all = [...linkProps, ...propertyArray].map((prop, i) => {
      const { Theme } = this.props;
      const { displayDate, searchTerm } = this.state;

      let showDateSelector = prop === 'Log' ? true : false;

      let showButton = showTag === prop ? true : false;

      let allDates = this.getAllDatesSorted(sort, prop, searchTerm);

      let { selectedDate, logDaysBunch } = this.logDayBunchLogic(prop, displayDate, allDates, logDaysBunch);

      const isLink = this.isLinkCheck(sort, prop);

      let animate = this.enableAnimationCheck(showTag, prop);

      let bunch = this.createNoteItemBunch(allDates, prop, selectedDate, showButton);

      bunch = this.handleLinkButtons(animate, isLink, allDates, bunch);

      const linkBorder = isLink ? 'link-border' : '';
      const themeBack = `${Theme.toLowerCase()}-back`;
      const themeBorder = `${Theme.toLowerCase()}-border-thick`;
      const themeHover = `${Theme.toLowerCase()}-hover`;

      if (bunch.length === 0) return;
      const { index } = this.props;
      const className = index > 0 ? 'detailedBox  detailedBox-override' : 'detailedBox';
      return (
        <div className={className} key={prop + i}>
          {this.noteDetailListItem(linkBorder, showTag, prop, themeBorder, isLink, bunch, showDateSelector, themeBack, themeHover)}
          {this.noteItemsBunch(animate, logDaysBunch, bunch)}
        </div>
      );
    });
    return all;
  };

  noteDetailItemClick(nextPerson, person, tagName) {
    const showPerson = nextPerson ? person : person;
    const tags = this.getNoteByTag(showPerson.dataLable, tagName);
    localStorage.setItem('showTag', tagName);
    this.setState({ showTag: tagName, person, tags });
  }

  handleLinkInLinkClick(showLink, nextPerson, tagName) {
    console.log('Should open sub list here', showLink[1]);
    window.history.pushState(nextPerson.heading, 'Sub Dir', `/notes/${nextPerson.id}`);
    localStorage.setItem('showTag', tagName);
    this.setState({ showTag: tagName, showLink: [''] });
    this.refreshItems(nextPerson);
  }

  handleLinkClick(tagData, person, tagName, showLink, lastLink) {
    const noteId = tagData.data.substring(5);
    const { notes } = this.props;
    let personNext = notes && notes[0] ? notes.find((note) => note.id === noteId) : null;

    const parentId = person.id;
    console.log('parentId', parentId);
    this.props.openPage({ personNext, parentId: parentId });
    // this.props.openPage({ personNext,  parentId: person.id});
    return;
    const tags = this.getNoteByTag(person.dataLable, tagName);
    localStorage.setItem('showTag', tagName);
    if (showLink.length > 1) {
      window.history.pushState(personNext.heading, 'Sub Dir', `/notes/${personNext.id}`);
      this.setState({ showLink: [''] });
      this.refreshItems(personNext);
    } else {
      const linkArray =
        lastLink !== noteId ? (showLink.includes(noteId) ? showLink.slice(0, showLink.indexOf(noteId)) : [...showLink, noteId]) : showLink;
      this.setState({ showTag: tagName, person, tags, showLink: linkArray });
    }
  }

  noteItemsBunch(animate, logDaysBunch, bunch) {
    return (
      <div className={`${animate}`}>
        {logDaysBunch}
        {bunch}
      </div>
    );
  }

  enableAnimationCheck(showTag, prop) {
    let animate = '';
    if (showTag === prop && showTag !== '' && prop !== 'Log') animate = 'grow';
    if (showTag === prop && showTag !== '' && prop === 'Log') animate = 'growb';
    return animate;
  }

  isLinkCheck(sort, prop) {
    return sort[prop] && sort[prop][0] && sort[prop][0].startsWith('href:');
  }

  setLogAndLinksAtTop(sort) {
    let propertyArray = Object.keys(sort).sort();

    if (propertyArray.includes('Log')) {
      propertyArray = propertyArray.filter((prop) => prop !== 'Log');
      propertyArray.unshift('Log');
    }

    let linkProps = [];
    propertyArray = propertyArray.filter((prop) => {
      const isLink = sort[prop] && sort[prop][0] && sort[prop][0].startsWith('href:');
      if (isLink) {
        linkProps.push(prop);
      }
      return !isLink;
    });
    return { linkProps, propertyArray };
  }

  handleLinkButtons(animate, isLink, allDates, bunch) {
    const { editName } = this.state
    if (animate === 'grow' && isLink && !editName) {
      if (allDates && allDates[0] && allDates[0].startsWith('href:')) {
        // Is link
        const noteId = allDates[0].substring(5);
        const { notes } = this.props;
        let noteHeadings = notes && notes[0] ? notes.find((note) => note.id === noteId) : null;
        let buttons = this.getNoteByTag(noteHeadings.dataLable, '');
        bunch = buttons;
      }
    }
    return bunch;
  }

  getAllDatesSorted(sort, prop, searchTerm) {
    let allDates = [...sort[prop]];

    allDates = allDates.sort((a, b) => {
      if (a.includes('"json":true')) {
        return new Date(JSON.parse(a).date) - new Date(JSON.parse(b).date);
      }
    });

    if (searchTerm) {
      allDates = allDates.filter((item) => JSON.stringify(item).toLowerCase().includes(searchTerm));
    }
    return allDates;
  }

  logDayBunchLogic(prop, selectedDate, allDates, logDaysBunch) {
    if (prop === 'Log') {
      if (selectedDate === null) {
        let lastDate = [...allDates].slice(allDates.length - 1);
        if (lastDate[0]) {
          lastDate = new Date(JSON.parse(lastDate[0]).date);
          selectedDate = lastDate;
          this.setState({ displayDate: selectedDate });
        }
      }
      const allLogDays = [...allDates].map((day) => (day = JSON.parse(day).date.substring(0, 15).trim()));

      const logDaysTemp = [...allLogDays].filter((v, ind, s) => s.indexOf(v) === ind);

      const logDays = [...logDaysTemp].map((day) => {
        const total = allLogDays.filter((allDay) => allDay === day).length;

        return { date: day, count: total };
      });

      let selDate = `${new Date(selectedDate)}`;
      selDate = selDate.substring(0, 15).trim();

      logDaysBunch = this.createNoteItemBunch(logDays.reverse(), 'Log Days', selectedDate, this.state.showLogDaysBunch);

      let selDates = [...allDates].filter((val) => val.includes(selDate));
      if (selDates.length > 0) {
        selDates = selDates.slice(selDates.length - 2);
        const contData = JSON.parse(selDates[0]).data;
        this.setState({ continueData: contData });
      }
    }
    return { selectedDate, logDaysBunch };
  }

  noteDetailListItem(linkBorder, showTag, prop, themeBorder, isLink, bunch, showDateSelector, themeBack, themeHover) {
    return (
      <div className={`detailTitleBox dark-hover ${linkBorder}`} onClick={() => this.showHideBox(showTag, prop)}>
        <div className={`listCountBox white-color ${themeBorder}`} onClick={() => this.showLogDays(prop)}>
          <span className="list-count-item"> {isLink ?  <i className="fas fa-folder" /> : bunch.length} </span>
        </div>
        <h3 className="detailBoxTitle white-color">{prop} </h3>
        {showDateSelector ? (
          <form className="detailBoxTitle dateSelector" onSubmit={this.changeDate}>
            <input id="note-detail-date" onChange={this.changeDate} className={themeBack} type="date" name="dateSelector" />
          </form>
        ) : (
            ''
          )}
        {showTag === 'Log' && prop === 'Log' ? (
          this.logHeader(themeBack, themeHover)
        ) : prop === 'Log' ? (
          <div>
            <button className={`detailBoxTitleButton ${themeBack} ${themeHover}`} onClick={() => this.showTagChange(prop)}>
              Show
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  logHeader(themeBack, themeHover) {
    return (
      <div>
        <button className={`detailBoxTitleButton ${themeBack} ${themeHover}`} onClick={() => this.showTagChange('')}>
          Hide
        </button>
        <div className="day-forward-back">
          <button className={`forward-back-button ${themeBack} ${themeHover}`} onClick={() => this.dateBackForward('back')}>
            <i className="fas fa-arrow-left" />
          </button>
          <button className={`forward-back-button ${themeBack} ${themeHover}`} onClick={() => this.dateBackForward('forward')}>
            <i className="fas fa-arrow-right" />
          </button>
        </div>
        <button
          className={`editButtons continue-button ${themeBack} ${themeHover}`}
          onClick={() => this.continueLog({ cont: this.state.continueData })}
        >
          Continue Previous Task
        </button>
        <br />
      </div>
    );
  }

  showLogDays(showTag) {
    const { showLogDaysBunch, person } = this.state;
    if (person && showTag === 'Log') {
      this.setState({ showLogDaysBunch: !showLogDaysBunch });
      const self = this;
      setTimeout(() => {
        self.showTagChange('');
      }, 200);
    }
  }

  createNoteItemBunch(items, prop, selectedDate, showButton) {
    const showEdit = prop !== 'Log Days';

    return items.map((item, ind) => {
      const prevItem = ind > -1 ? items[ind - 1] : null;
      let count = 0;
      if (prop === 'Log Days') {
        count = item.count;
        item = item.date;
      }
      return (
        <div onClick={() => this.setDate(prop, item)} key={item + prop + ind}>
          <NoteItem
            prevItem={prevItem}
            item={item}
            date={selectedDate}
            Theme={this.props.Theme}
            show={showButton}
            set={this.updateNoteItem}
            cont={this.continueLog}
            type={prop}
            index={ind}
            showEdit={showEdit}
            count={count}
          />
        </div>
      );
    });
  }
  cancelAddItemEdit() {
    this.props.hideAddItem({ show: false });
    this.setState({ showAddItem: false, addLable: null });
    localStorage.removeItem('new-folder-edit')
  }
  editNameBox(heading) {
    const themeBack = `${this.props.Theme.toLowerCase()}-back`;
    const themeHover = `${this.props.Theme.toLowerCase()}-hover`;
    return (
      <form onSubmit={this.submitNameChange}>
        <br />
        <input className={`changeNameHeading ${themeHover} ${themeBack}`} name="heading" type="text" defaultValue={heading} />
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

  addItem() {
    const themeBack = `${this.props.Theme.toLowerCase()}-back`;
    const themeHover = `${this.props.Theme.toLowerCase()}-hover`;
    return (
      <form onSubmit={this.submitNewItem}>
        <EditNoteCheck Theme={this.props.Theme} showTag={this.state.showTag} lable={this.state.addLable} allNotes={this.props.notes} />
        <br />
        <button className={`submit-button ${themeHover} ${themeBack}`} type="submit">
          <i className="fas fa-check" />
        </button>

        <button type="reset" className={`submit-button ${themeHover} ${themeBack}`} onClick={() => this.cancelAddItemEdit()}>
          {' '}
          <i className="fas fa-times" />{' '}
        </button>
        <br />
      </form>
    );
  }

  render() {
    let { person } = this.state;
    const { tags, editName } = this.state;
    const { match, Theme, showAddItem } = this.props;
    const editNameB = person ? this.editNameBox(person.heading) : null;

    const isNoteNames = match.url === '/notes/note-names';
    if (isNoteNames) person = null;

    return <div className="slide-in">{person ? this.pageContent(person, editName, editNameB, showAddItem, Theme, tags) : null}</div>;
  }

  pageContent(person, editName, editNameB, showAddItem, Theme, tags) {
    const themeBack = `${Theme.toLowerCase()}-back`;
    const themeHover = `${Theme.toLowerCase()}-hover`;
    return (
      <div className="note-detail-item" key={person.id}>
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
    );
  }
}
