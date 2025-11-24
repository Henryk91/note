import React, { Component } from 'react';
import { logoutUser } from '../../Helpers/requests';
import { Note } from '../../Helpers/types';
import {
  NoteDetailPageItem,
  Sidebar,
  ScrollButtons,
  BackButton,
} from './NoteDetailPageParts';

type Match = {
  isExact: boolean;
  params: { id: string };
  path: string;
  url: string;
};

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

  setNoteTheme = (name: string) => {
    const { set } = this.props;
    set({ noteTheme: name });
    localStorage.setItem('theme', name);
  };

  noteDetailSet = (msg: any) => {
    const { set } = this.props;

    if (msg.forParent) {
      this.setState({ ...msg });
    } else {
      set(msg);
    }
  };

  openPage = (msg: any) => {
    if (!msg.personNext) return;
    const nextPage = { params: { id: msg.personNext.id } };
    const { pages } = this.state;
    let updatePages = pages;
    const parentPageIndex = updatePages.findIndex((page) => page.params.id === msg.parentId);

    const pageFoundIndex = updatePages.findIndex((page) => page.params.id === msg.personNext.id);
    if (parentPageIndex > -1 && pageFoundIndex === -1) {
      updatePages = updatePages.slice(0, parentPageIndex + 1);
    } else if (parentPageIndex > 0 && pageFoundIndex > -1) {
      updatePages = updatePages.slice(0, pageFoundIndex + 1);
    }

    if (pageFoundIndex === -1) {
      const newPages =
        updatePages.length === 1 && updatePages[0].params.id === '' ? [nextPage] : [...updatePages, nextPage];

      this.setState({ pages: newPages });
      localStorage.setItem('saved-pages', JSON.stringify(newPages));
    } else if (pageFoundIndex > -1 && !msg.showNote) {
      const localPageFoundIndex = pageFoundIndex === 0 ? 1 : pageFoundIndex;
      const newPages = updatePages.slice(0, localPageFoundIndex);
      if (pageFoundIndex + 1 === updatePages.length) {
        this.scrollPageBack();
      } else {
        this.scrollPagesBackAndSet(updatePages.length, updatePages.length - pageFoundIndex, newPages);
      }
    } else if (pageFoundIndex > -1) {
      const freshStatePages = pages;
      if (pageFoundIndex === freshStatePages.length - 1) {
        if (freshStatePages.length + 1 === freshStatePages.length && msg.hideNote) {
          this.scrollPageBack();
        } else {
          const last = freshStatePages[freshStatePages.length - 1];
          const secondTolast = freshStatePages[freshStatePages.length - 2];

          if (secondTolast && last && last.params.id !== secondTolast.params.id) {
            freshStatePages.push(last);
            this.setState({ pages: freshStatePages });
            localStorage.setItem('saved-pages', JSON.stringify(freshStatePages));
          }
          if (secondTolast && last && last.params.id === secondTolast.params.id) {
            this.setState({ pages: freshStatePages });
            localStorage.setItem('saved-pages', JSON.stringify(freshStatePages));
          }
        }
      }

      const localPages = localStorage.getItem('saved-pages');

      if (msg.showNote && !msg.hideNote) {
        const locals = localPages ? JSON.parse(localPages) : [];
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

  showAddItemSet = (bVal: boolean) => {
    this.setState({ showAddItem: bVal });
    if (bVal) window.scrollTo(0, 0);
  };

  logOut = () => {
    logoutUser(() => window.location.reload());
  };

  addButtonClicked = (showAddItem: boolean) => {
    this.showAddItemSet(!showAddItem);
  };

  editNameSet = () => {
    window.scrollTo(0, 0);
    const { editName } = this.state;
    this.setState({ editName: !editName });
  };

  prepForNote = (name: string) => {
    const { set } = this.props;
    set({ noteName: name });
  };

  customScrollBy(element: HTMLElement, startPosition: number, endPosition: number) {
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

  scrollPagesBackAndSet(currentPageCount: number, pagesBackCount: number, pages: PageDescriptor[]) {
    if (pages && pages.length > 1) {
      const noteDetailPage = document.getElementById('multiple-pages');
      if (noteDetailPage) {
        let pageWidth = noteDetailPage.scrollWidth / currentPageCount;
        pageWidth -= pageWidth / (5 + currentPageCount);

        this.customScrollBy(noteDetailPage, noteDetailPage.scrollWidth - pageWidth, noteDetailPage.scrollWidth - pageWidth * pagesBackCount);
      }
      const self = this;
      setTimeout(() => {
        self.setState({ pages });
        localStorage.setItem('saved-pages', JSON.stringify(pages));
      }, 500);
    }
  }

  scrollPageBack() {
    const { pages } = this.state;
    if (pages && pages.length > 1) {
      const pageCount = pages.length;
      const noteDetailPage = document.getElementById('multiple-pages');
      if (noteDetailPage) {
        const pageWidth = noteDetailPage.scrollWidth / pageCount;

        this.customScrollBy(noteDetailPage, noteDetailPage.scrollWidth - pageWidth, noteDetailPage.scrollWidth - pageWidth - pageWidth - 15);
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

  render() {
    const { pages } = this.state;
    let localPages = pages;
    const { showAddItem, editName } = this.state;
    const { match, noteNames, Theme, searchTerm, notes } = this.props;

    const isNoteNames = match.url === '/notes/note-names';
    if (isNoteNames) {
      localPages = [{ params: { id: '' } }];
    }

    const lastPageIndex = localPages.length - 1;
    const pagesCont = localPages.map((pageLink, index) => {
      const lastPageShowAddItem = showAddItem && index === lastPageIndex;
      const lastPage = index === lastPageIndex;
      return (
        <NoteDetailPageItem
          key={(pageLink?.params?.id ?? 'first') + index}
          searchTerm={searchTerm}
          noteNames={noteNames}
          Theme={Theme}
          notes={notes}
          pageLink={pageLink}
          showAddItem={lastPageShowAddItem}
          index={index}
          editName={editName}
          lastPage={lastPage}
          pageCount={localPages.length}
          hideAddItem={this.hideAddItem}
          set={this.noteDetailSet}
          openPage={this.openPage}
          initShowtag={pageLink}
          {...this.props}
        />
      );
    });

    const showBackButton = pages.length > 1;
    return (
      <div className="slide-in" key={match.url}>
        <BackButton
          Theme={Theme}
          hasPages={pages.length > 1}
          onBack={this.scrollPageBack.bind(this)}
          onLogout={this.logOut}
        />
        {isNoteNames && (
          <Sidebar noteNames={noteNames} prepForNote={this.prepForNote} setNoteTheme={this.setNoteTheme} />
        )}
        <div id="multiple-pages">{pagesCont}</div>
        <ScrollButtons
          Theme={Theme}
          showAddItem={showAddItem}
          showBackButton={showBackButton}
          onEditName={this.editNameSet}
          onAdd={() => this.addButtonClicked(showAddItem)}
        />
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
