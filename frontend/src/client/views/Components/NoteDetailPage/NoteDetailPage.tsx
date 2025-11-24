import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import NoteDetail from '../NoteDetail/NoteDetail';
import { logoutUser } from '../../Helpers/requests';
import { Note } from '../../Helpers/types';

type Match = {
  isExact: boolean;
  params: {id: string};
  path: string;
  url: string;
}

type NoteDetailPageProps = {
  noteNames: string[] | null;
  Theme: string;
  notes: Note[] | null;
  set: (payload: any) => void;
  searchTerm?: string;
  match: Match;
};

type PageDescriptor = { params: { id: string } };

type NoteDetailPageState = {
  showAddItem: boolean;
  editName: boolean;
  pages: PageDescriptor[];
};

export default class NoteDetailPage extends Component<NoteDetailPageProps, NoteDetailPageState> {
  constructor(props: NoteDetailPageProps) {
    super(props);
    this.state = {
      showAddItem: false,
      editName: false,
      pages: [{ params: { id: 'main' } }],
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

  componentDidMount() {
    const localPages = localStorage.getItem('saved-pages');
    if (localPages) {
      let pages = JSON.parse(localPages);
      pages = pages.filter((page) => page.params.id !== '');
      if (pages.length > 1) this.setState({ pages: JSON.parse(localPages) });
    }

    const isEditing = localStorage.getItem('new-folder-edit');
    if (isEditing) {
      this.setState({ showAddItem: true });
      localStorage.removeItem('new-folder-edit');
      localStorage.setItem('was-new-folder-edit', 'true');
    }
  }

  setNoteTheme = (name) => {
    const { set } = this.props;
    set({ noteTheme: name });
    localStorage.setItem('theme', name);
  };

  showNoteThemes = (names) =>
    names.map((name) => (
      <Link
        key={name}
        style={{ textDecoration: 'none' }}
        to="/"
        title="Note List"
      >
        <div className="listNameButton" onClick={() => this.setNoteTheme(name)}>
          <h3> {name} Theme </h3>
        </div>
      </Link>
    ));

  noteDetailSet = (msg) => {
    const { set } = this.props;

    if (msg.forParent) {
      this.setState({ ...msg });
    } else {
      set(msg);
    }
  };

  openPage = (msg) => {
    if (!msg.personNext) return;
    const nextPage = { params: { id: msg.personNext.id } };
    const { pages } = this.state;
    let updatePages = pages;
    const parentPageIndex = updatePages.findIndex(
      (page) => page.params.id === msg.parentId,
    );

    const pageFoundIndex = updatePages.findIndex(
      (page) => page.params.id === msg.personNext.id,
    );
    if (parentPageIndex > -1 && pageFoundIndex === -1) {
      updatePages = updatePages.slice(0, parentPageIndex + 1);
    } else if (parentPageIndex > 0 && pageFoundIndex > -1) {
      updatePages = updatePages.slice(0, pageFoundIndex + 1);
    }

    if (pageFoundIndex === -1) {
      const newPages =
        updatePages.length === 1 && updatePages[0].params.id === ''
          ? [nextPage]
          : [...updatePages, nextPage];

      this.setState({ pages: newPages });
      localStorage.setItem('saved-pages', JSON.stringify(newPages));
    } else if (pageFoundIndex > -1 && !msg.showNote) {
      const localPageFoundIndex = pageFoundIndex === 0 ? 1 : pageFoundIndex;
      const newPages = updatePages.slice(0, localPageFoundIndex);
      if (pageFoundIndex + 1 === updatePages.length) {
        this.scrollPageBack();
      } else {
        this.scrollPagesBackAndSet(
          updatePages.length,
          updatePages.length - pageFoundIndex,
          newPages,
        );
      }
    } else if (pageFoundIndex > -1) {
      const freshStatePages = pages;
      if (pageFoundIndex === freshStatePages.length - 1) {
        if (
          freshStatePages.length + 1 === freshStatePages.length &&
          msg.hideNote
        ) {
          this.scrollPageBack();
        } else {
          const last = freshStatePages[freshStatePages.length - 1];
          const secondTolast = freshStatePages[freshStatePages.length - 2];

          if (
            secondTolast &&
            last &&
            last.params.id !== secondTolast.params.id
          ) {
            freshStatePages.push(last);
            this.setState({ pages: freshStatePages });
            localStorage.setItem(
              'saved-pages',
              JSON.stringify(freshStatePages),
            );
          }
          if (
            secondTolast &&
            last &&
            last.params.id === secondTolast.params.id
          ) {
            this.setState({ pages: freshStatePages });
            localStorage.setItem(
              'saved-pages',
              JSON.stringify(freshStatePages),
            );
          }
        }
      }

      const localPages = localStorage.getItem('saved-pages');

      if (msg.showNote && !msg.hideNote) {
        const locals = localPages? JSON.parse(localPages): [];
        const last = locals[locals.length - 1];
        const secondTolast = locals[locals.length - 2];

        if (secondTolast && last && last.params.id === secondTolast.params.id) {
          this.setState({ pages: locals });
          localStorage.setItem('saved-pages', JSON.stringify(locals));
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

  showNoteNames = (names) =>
    names?.map((name) => (
      <Link
        key={name}
        style={{ textDecoration: 'none' }}
        to="/notes/main"
        title="Note List"
      >
        <div className="listNameButton" onClick={() => this.prepForNote(name)}>
          <h3> {name} </h3>
        </div>
      </Link>
    ));

  logOut = () => {
    logoutUser(() => window.location.reload());
  };

  addButtonClicked = (showAddItem) => {
    this.showAddItemSet(!showAddItem);
  };

  editNameSet = () => {
    window.scrollTo(0, 0);
    const { editName } = this.state;
    this.setState({ editName: !editName });
  };

  prepForNote = (name) => {
    const { set } = this.props;
    set({ noteName: name });
  };

  scrollButtons(Theme, showAddItem) {
    const themeBack = `${Theme.toLowerCase()}-back`;
    const themeHover = `${Theme.toLowerCase()}-hover`;
    const { pages } = this.state;

    const showBackButton = pages.length > 1;
    return (
      <div className="detail-scroll">
        <button
          className={`editButtons1 detailUpButton ${themeHover} ${themeBack}`}
          onClick={() => this.editNameSet()}
        >
          <i className="fas fa-pen" />
        </button>
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
            <Link
              style={{ textDecoration: 'none', color: 'white' }}
              to="/new-note/"
            >
              <i className="fas fa-plus" />
            </Link>
          </div>
        ) : (
          <div
            className={`detailAddButton ${themeHover} ${themeBack}`}
            onClick={() => {
              this.addButtonClicked(showAddItem);
            }}
          >
            <i className="fas fa-plus" />
          </div>
        )}
      </div>
    );
  }

  backButton(Theme) {
    const themeBack = `${Theme.toLowerCase()}-back`;
    const { pages } = this.state;
    const hasPages = pages.length > 1;

    return (
      <button
        className={`backButton ${themeBack}`}
        onClick={() => {
          if (hasPages) {
            this.scrollPageBack();
          } else {
            this.logOut();
          }
        }}
      >
        <i className={hasPages ? 'fas fa-arrow-left' : 'fas fa-power-off'} />
      </button>
    );
  }

  scrollPagesBackAndSet(currentPageCount, pagesBackCount, pages) {
    if (pages && pages.length > 1) {
      const noteDetailPage = document.getElementById('multiple-pages');
      if (noteDetailPage) {
        let pageWidth = noteDetailPage.scrollWidth / currentPageCount;
        pageWidth -= pageWidth / (5 + currentPageCount);
        const scrollAmount = pageWidth * pagesBackCount * -1;

        noteDetailPage.scrollBy({
          top: 0,
          left: scrollAmount,
          behavior: 'smooth',
        });
      }
      const self = this;
      setTimeout(() => {
        localStorage.removeItem('showTag');
        self.setState({ pages });
      }, 500);
    }
  }

  customScrollBy(element, startPosition, endPosition) {
    window.scrollTo({ top: 0 });
    const left = startPosition > endPosition;
    let i = startPosition;
    const int = setInterval(() => {
      element.scrollTo({ top: 0, left: i });
      if (left) {
        i -= 8;
      } else {
        i += 8;
      }
      if (left && i <= endPosition) clearInterval(int);
      if (!left && i >= endPosition) clearInterval(int);
    }, 1);
  }

  scrollPageBack() {
    const { pages } = this.state;
    if (pages && pages.length > 1) {
      const pageCount = pages.length;
      const noteDetailPage = document.getElementById('multiple-pages');
      if (noteDetailPage) {
        const pageWidth = noteDetailPage.scrollWidth / pageCount;

        this.customScrollBy(
          noteDetailPage,
          noteDetailPage.scrollWidth - pageWidth,
          noteDetailPage.scrollWidth - pageWidth - pageWidth -15,
        );
      }
      const self = this;
      setTimeout(() => {
        const remainingPages = pages.slice(0, pageCount - 1);
        localStorage.removeItem('showTag');
        self.setState({ pages: remainingPages });
        localStorage.setItem('saved-pages', JSON.stringify(remainingPages));
      }, 500);
    }
  }

  createNoteDetailPage(
    searchTerm,
    noteNames,
    Theme,
    notes,
    pageLink,
    showAddItem,
    index,
    editName,
    lastPage,
    pageCount,
  ) {
    const key =
      pageLink && pageLink.params && pageLink.params.id
        ? pageLink.params.id
        : 'first';
    return (
      <div id="multiple-pages1" key={key + index}>
        <NoteDetail
          pageCount={pageCount}
          hideAddItem={this.hideAddItem}
          searchTerm={searchTerm}
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

  sidebarPage(noteNames) {
    const noteNameBlock = this.showNoteNames(noteNames);
    const noteThemeBlock = this.showNoteThemes([
      'Red',
      'Ocean',
      'Green',
      'Dark',
      'Night',
    ]);
    return (
      <div>
        <br />
        <h3 className="page-content-top1">Note Book Names</h3>
        {noteNameBlock}
        <br />
        <h3>Apps</h3>
        <Link
          key="memento"
          style={{ textDecoration: 'none' }}
          to="/memento"
          title="Note List"
        >
          <div className="listNameButton">
            {' '}
            <h3> Memento </h3>
          </div>
        </Link>
        <Link
          key="pomodoro"
          style={{ textDecoration: 'none' }}
          to="/pomodoro"
          title="Note List"
        >
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

  render() {
    const { pages } = this.state;
    let localPages = pages;
    const { showAddItem, editName } = this.state;
    const { match, noteNames, Theme, searchTerm, notes } = this.props;

    const isNoteNames = match.url === '/notes/note-names';
    if (isNoteNames) {
      localPages = [{ params: { id: '' } }];
    }

    let clone = JSON.parse(JSON.stringify(localPages));
    if (
      clone &&
      clone[0] &&
      clone[0].params.id !== '' &&
      clone[0].params.id !== 'main'
    ) {
      clone = [{ params: { id: 'main' } }, ...clone];
    }

    const lastPageIndex = localPages.length - 1;
    const pagesCont = localPages.map((pageLink, index) => {
      const lastPageShowAddItem = showAddItem && index === lastPageIndex;
      const lastPage = index === lastPageIndex;
      return this.createNoteDetailPage(
        searchTerm,
        noteNames,
        Theme,
        notes,
        pageLink,
        lastPageShowAddItem,
        index,
        editName,
        lastPage,
        localPages.length,
      );
    });
    return (
      <div className="slide-in" key={match.url}>
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
}
