import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { NoteDetail } from '../index';

export default class NoteDetailPage extends Component {
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
      pages: [{ params: { id: '' } }],
    };
    this.openPage = this.openPage.bind(this);
    this.noteDetailSet = this.noteDetailSet.bind(this);
    this.showNoteNames = this.showNoteNames.bind(this);
    this.showNoteThemes = this.showNoteThemes.bind(this);
    this.showAddItemSet = this.showAddItemSet.bind(this);
    this.hideAddItem = this.hideAddItem.bind(this);
    this.setNoteTheme = this.setNoteTheme.bind(this);
    this.editNameSet = this.editNameSet.bind(this);
    this.prepForNote = this.prepForNote.bind(this);
  }

  componentDidMount(){
    const localPages = localStorage.getItem('saved-pages')
    if(localPages)this.setState({pages: JSON.parse(localPages)})
  // }
  // componentDidMount(){
    const isEditing = localStorage.getItem('new-folder-edit');
    if(isEditing){
      this.setState({showAddItem: true})
      localStorage.removeItem('new-folder-edit')
      localStorage.setItem('was-new-folder-edit',true)
    }
  }
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

  noteDetailSet = (msg) => {
    if(msg.forParent){
     delete msg.forParent
     this.setState({...msg})
    } else {
      this.props.set(msg);
    }
    
  };
  openPage = (msg) => {
    if (!msg.personNext) return;
    const nextPage = { params: { id: msg.personNext.id } };
    let { pages } = this.state;

    const parentPageIndex = pages.findIndex((page) => page.params.id === msg.parentId);

    const pageFoundIndex = pages.findIndex((page) => page.params.id === msg.personNext.id);
    if (parentPageIndex > -1 && pageFoundIndex === -1) {
      pages = pages.slice(0, parentPageIndex + 1);
    } else if (parentPageIndex > 0 && pageFoundIndex > -1) {
      pages = pages.slice(0, pageFoundIndex + 1);
    }

    if (pageFoundIndex === -1) {
      const newPages = pages.length === 1 && pages[0].params.id === '' ? [nextPage] : [...pages, nextPage];

      if(pages.length >= newPages.length ) {
        // this.scrollBackSetPage(newPages)
        this.setState({ pages: newPages });
      } else {
        this.setState({ pages: newPages });
      }
    } else if (pageFoundIndex > -1 && !msg.showNote) {
      const localPageFoundIndex = pageFoundIndex === 0 ? 1 : pageFoundIndex;
      const newPages = pages.slice(0, localPageFoundIndex);
      if(pageFoundIndex + 1 === this.state.pages.length) {
        this.scrollPageBack();
      } else {
        this.scrollPagesBackAndSet(this.state.pages.length, this.state.pages.length - pageFoundIndex, newPages);
      }
    } else if (pageFoundIndex > -1) {

      if(pageFoundIndex === pages.length -1) {
       
        if(pages.length + 1 === this.state.pages.length && msg.hideNote) {
          this.scrollPageBack();
        } else {
          const last = pages[pages.length -1]
          const secondTolast = pages[pages.length -2]

          if(secondTolast && last && last.params.id !== secondTolast.params.id){
            pages.push(last);
            this.setState({ pages });
          } 
          if(secondTolast && last && last.params.id === secondTolast.params.id){
            this.setState({ pages });
          } 
        }
      }

      const localPages = localStorage.getItem('saved-pages');
      
      if(msg.showNote && !msg.hideNote) {

        const locals = JSON.parse(localPages);
        const last = locals[locals.length -1]
        const secondTolast = locals[locals.length -2]

        if(secondTolast && last && last.params.id === secondTolast.params.id){
          this.setState({ pages: locals });
        } 
      }
    }
  };

  hideAddItem = () => {
    this.setState({ showAddItem: false });
  };

  showAddItemSet = (bVal) => {
    this.setState({ showAddItem: bVal });
    if (bVal) window.scrollTo(0, 0);
  };

  render() {
    let { person, pages } = this.state;
    const { showAddItem, tags, editName } = this.state;
    const { match, noteNames, Theme, searchTerm, notes } = this.props;

    const editNameB = person ? this.editNameBox(person.heading) : null;

    const isNoteNames = match.url === '/notes/note-names';
    if (isNoteNames) {
      person = null;
      pages = [{ params: { id: '' } }]
      localStorage.removeItem('saved-pages')
    }
    
    const clone = JSON.parse(JSON.stringify(pages))
    localStorage.setItem('saved-pages', JSON.stringify(clone))
    const pagesCont = pages.map((pageLink, index) => {
      const lastPageShowAddItem = showAddItem && index === (pages.length - 1);
      const lastPage = index === (pages.length - 1)
      return this.createNoteDetailPage(searchTerm, noteNames, Theme, notes, pageLink, lastPageShowAddItem, index, editName, lastPage, pages.length);
    });
    return (
      <div className="slide-in" key={match.urls}>
        {this.backButton(Theme)}
        {isNoteNames ? this.sidebarPage(noteNames) : null}
        <div id="multiple-pages">{pagesCont}</div>
        {false ? '' : this.scrollButtons(Theme, showAddItem)}
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
      </div>
    );
  }

  createNoteDetailPage(searchTerm, noteNames, Theme, notes, pageLink, showAddItem, index, editName, lastPage, pageCount) {

    const key = pageLink && pageLink.params && pageLink.params.id ? pageLink.params.id : 'first';
    return (
      <div id="multiple-pages1" key={key+index}>
        <NoteDetail
          pageCount={pageCount}
          hideAddItem={this.hideAddItem}
          SearchTerm={searchTerm}
          noteNames={noteNames}
          Theme={Theme}
          {...this.props}
          set={this.noteDetailSet}
          openPage={this.openPage}
          notes={notes}
          initShowtag={pageLink}
          index={index}
          showAddItem={showAddItem}
          editName={editName}
          lastPage={lastPage}
        />
      </div>
    );
  }

  scrollPageBack() {
    const { pages } = this.state;
    if(pages && pages.length > 1){
      const pageCount = pages.length;
      let noteDetailPage = document.getElementById('multiple-pages');
      if (noteDetailPage) {
        let pageWidth = (noteDetailPage.scrollWidth / pageCount);

        this.customScrollBy(noteDetailPage, noteDetailPage.scrollWidth - pageWidth, ( noteDetailPage.scrollWidth - pageWidth - pageWidth));
      }
      let self = this;
      setTimeout(() => {
        let remainingPages = pages.slice(0, pageCount -1);
        localStorage.removeItem('showTag');
        self.setState({ pages: remainingPages, showTag: null });
      }, 500);
    }
  }

  customScrollBy(element, startPosition, endPosition){
    window.scrollTo({top: 0});
    const left = startPosition > endPosition;
    var i = startPosition;
    var int = setInterval(function() {
      element.scrollTo({top: 0, left:i});
      if(left) {
        i -= 8;
      } else {
        i += 8;
      }
      if (left && i <= endPosition) clearInterval(int);
      if (!left && i >= endPosition) clearInterval(int);
    }, 1);
  }
  
  scrollPagesBackAndSet(currentPageCount, pagesBackCount, pages) {
    if(pages && pages.length > 1){
      let noteDetailPage = document.getElementById('multiple-pages');
      if (noteDetailPage) {
        let pageWidth = (noteDetailPage.scrollWidth / currentPageCount);
        pageWidth = pageWidth - (pageWidth/(5+currentPageCount));
        let scrollAmount = (pageWidth*pagesBackCount * -1);

        noteDetailPage.scrollBy({
          top: 0,
          left: scrollAmount,
          behavior: 'smooth'
        });
      }
      let self = this;
      setTimeout(() => {
        localStorage.removeItem('showTag');
        self.setState({ pages, showTag: null });
      }, 500);
    }
  }

  backButton(Theme) {
    const themeBack = `${Theme.toLowerCase()}-back`;
    return (
      <button
        className={`backButton ${themeBack}`}
        onClick={() => {
          window.history.back();
        }}
      >
        <i className="fas fa-arrow-left" />
      </button>
    );
  }

  addButtonClicked = (showAddItem) => {
    showAddItem ? this.showAddItemSet(false) : this.showAddItemSet(true);
  }

  editNameSet = () => {
    window.scrollTo(0, 0);
    const { editName } = this.state;
    this.setState({ editName: !editName });
  };

  scrollButtons(Theme, showAddItem) {
    const themeBack = `${Theme.toLowerCase()}-back`;
    const themeHover = `${Theme.toLowerCase()}-hover`;
    const { pages } = this.state;

    const showBackButton = pages.length > 1;
    return (
      <div className="detail-scroll">
        <button className={`editButtons1 detailUpButton ${themeHover} ${themeBack}`} onClick={() => this.editNameSet()}>
          <i className="fas fa-pen" />
        </button>
        {showBackButton? 
          <button className={`detailUpButton ${themeHover} ${themeBack}`} onClick={() => this.scrollPageBack()}>
            <i className="fas fa-arrow-left" />
          </button>
        : null}
        <div
          className={`detailUpButton ${themeHover} ${themeBack}`}
          onClick={() => {
            window.scrollTo(0, 0);
          }}
        >
          <i className="fas fa-arrow-up" />
        </div>
        <div
          className={`detailUpButton ${themeHover} ${themeBack}`}
          onClick={() => {
            window.scrollBy(0, document.body.scrollHeight);
          }}
        >
          <i className="fas fa-arrow-down" />
        </div>
        {showBackButton === false ? (
          <div className={`detailAddButton ${themeHover} ${themeBack}`}>
            <Link style={{ textDecoration: 'none', color: 'white' }}    to="/new-note/" onClick={console.log('New Note')}>
              <i className="fas fa-plus" />
            </Link>
          </div>
        ) : <div
            className={`detailAddButton ${themeHover} ${themeBack}`}
            onClick={() => {
              this.addButtonClicked(showAddItem)
            }}
          >
            <i className="fas fa-plus" />
          </div>
        }
        
      </div>
    );
  }

  prepForNote = (name) => {
    const user =localStorage.getItem('user');
    if(user !== name){
      const test = {params: {id: "main"}}
      localStorage.setItem('saved-pages', JSON.stringify(test))
      this.setState({ pages: [test] });
    }
    this.props.set({ noteName: name })
  }

  showNoteNames = (names) => {
    if (!names) return;

    return names.map((name) => (
      <Link key={name} style={{ textDecoration: 'none' }} to="/notes/main" title="Note List">
        <div className="listNameButton" onClick={() => this.prepForNote(name)}>
          <h3> {name} </h3>
        </div>
      </Link>
    ));
  };

  sidebarPage(noteNames) {
    const noteNameBlock = this.showNoteNames(noteNames);
    const noteThemeBlock = this.showNoteThemes(['Red', 'Ocean', 'Green', 'Dark', 'Night']);
    return (
      <div>
        <br />
        <h3 className="page-content-top1">Note Book Names</h3>
        {noteNameBlock}
        <br />
        <h3>Apps</h3>
        <Link key="memento" style={{ textDecoration: 'none' }} to="/memento" title="Note List">
          <div className="listNameButton">
            {' '}
            <h3> Memento </h3>
          </div>
        </Link>
        <Link key="pomodoro" style={{ textDecoration: 'none' }} to="/pomodoro" title="Note List">
          <div className="listNameButton">
            {' '}
            <h3> Pomodoro </h3>
          </div>
        </Link>
        <br />
        <h3>Themes</h3>
        {noteThemeBlock}
      </div>
    );
  }
}
