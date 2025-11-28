import React, { useCallback, useEffect, useState } from 'react';
import { logoutUser } from '../../Helpers/requests';
import { Note } from '../../Helpers/types';
import {
  NoteDetailPageItem,
  Sidebar,
  ScrollButtons,
  BackButton,
} from './NoteDetailPageParts';


import { useDispatch } from 'react-redux';
import { removePersonById, setPersonById } from '../../../../store/personSlice';

type Match = {
  isExact: boolean;
  params: { id: string };
  path: string;
  url: string;
};

type NoteDetailPageProps = {
  noteNames: string[] | null;
  notes: Note[] | null;
  set: (payload: any) => void;
  searchTerm?: string;
  match: Match;
};

type PageDescriptor = { params: { id: string, tempId: string } };

const DEFAULT_PAGE = [{ params: { id: 'main', tempId: 'main' } }]

const NoteDetailPage: React.FC<NoteDetailPageProps> = ({
  match,
  noteNames,
  searchTerm,
  notes,
  set,
  ...rest
}) => {
  const [showAddItem, setShowAddItem] = useState(false);
  const [editName, setEditName] = useState(false);
  const [pages, setPages] = useState<PageDescriptor[]>(DEFAULT_PAGE);
  const dispatch = useDispatch();

  useEffect(() => {
    const localPages = localStorage.getItem('saved-pages');
    if (localPages) {
      let savedPages = JSON.parse(localPages);
      savedPages = savedPages.filter((page: PageDescriptor) => page.params.id !== '');
      if (savedPages.length > 0) setPages(JSON.parse(localPages));
    }

    const isEditing = localStorage.getItem('new-folder-edit');
    if (isEditing) {
      setShowAddItem(true);
      localStorage.removeItem('new-folder-edit');
      localStorage.setItem('was-new-folder-edit', 'true');
    }
  }, []);

  const noteDetailSet = useCallback(
    (msg: any) => {
      if (msg.forParent) {
        if (Object.prototype.hasOwnProperty.call(msg, 'showAddItem')) setShowAddItem(msg.showAddItem);
        if (Object.prototype.hasOwnProperty.call(msg, 'editName')) setEditName(msg.editName);
        if (Object.prototype.hasOwnProperty.call(msg, 'pages')) setPages(msg.pages);
      } else {
        set(msg);
      }
    },
    [set],
  );

  const customScrollBy = useCallback((element: HTMLElement, startPosition: number, endPosition: number) => {
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
  }, []);

  const scrollPagesBackAndSet = useCallback(
    (currentPageCount: number, pagesBackCount: number, nextPages: PageDescriptor[]) => {
      if (nextPages && nextPages.length > 1) {
        const noteDetailPage = document.getElementById('multiple-pages');
        if (noteDetailPage) {
          let pageWidth = noteDetailPage.scrollWidth / currentPageCount;
          pageWidth -= pageWidth / (5 + currentPageCount);

          customScrollBy(
            noteDetailPage,
            noteDetailPage.scrollWidth - pageWidth,
            noteDetailPage.scrollWidth - pageWidth * pagesBackCount,
          );
        }
        setTimeout(() => {
          setPages(nextPages);
          localStorage.setItem('saved-pages', JSON.stringify(nextPages));
        }, 50);
      }
    },
    [customScrollBy],
  );

  const scrollPageBack = useCallback(() => {
    if (pages && pages.length > 1) {
      setTimeout(() => {
        dispatch(removePersonById({id: `${pages.length -1}`}))
      }, 500)
      const pageCount = pages.length;
      const noteDetailPage = document.getElementById('multiple-pages');
      if (noteDetailPage) {
        const pageWidth = noteDetailPage.scrollWidth / pageCount;

        customScrollBy(
          noteDetailPage,
          noteDetailPage.scrollWidth - pageWidth,
          noteDetailPage.scrollWidth - pageWidth - pageWidth - 15,
        );
      }
      setTimeout(() => {
        const remainingPages = pages.slice(0, pageCount - 1);
        localStorage.removeItem('showTag');
        setPages(remainingPages);
        localStorage.setItem('saved-pages', JSON.stringify(remainingPages));
      }, 500);
    }
  }, [customScrollBy, pages]);

  const openPage = useCallback(
    (msg: any) => {
      if (!msg.personNext) return;
      dispatch(setPersonById({ id: `${pages.length}`, person: {...msg?.personNext} }));

      const nextPage = { params: { id: msg.personNext.id, tempId: `${msg.personNext.id}-${msg.personNext.heading}` } };

      const localPages = localStorage.getItem('saved-pages');

      let updatePages = pages;
      if(localPages) updatePages = JSON.parse(localPages);
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
        setPages(newPages);
        localStorage.setItem('saved-pages', JSON.stringify(newPages));
      } else if (pageFoundIndex > -1 && !msg.showNote) {
        const localPageFoundIndex = pageFoundIndex === 0 ? 1 : pageFoundIndex;
        const newPages = updatePages.slice(0, localPageFoundIndex);
        if (pageFoundIndex + 1 === updatePages.length) {
          scrollPageBack();
        } else {
          scrollPagesBackAndSet(updatePages.length, updatePages.length - pageFoundIndex, newPages);
        }
      } else if (pageFoundIndex > -1) {
        const freshStatePages = [...pages];
        if (pageFoundIndex === freshStatePages.length - 1) {
          if (freshStatePages.length + 1 === freshStatePages.length && msg.hideNote) {
            scrollPageBack();
          } else {
            const last = freshStatePages[freshStatePages.length - 1];
            const secondTolast = freshStatePages[freshStatePages.length - 2];

            if (secondTolast && last && last.params.id !== secondTolast.params.id) {
              const updated = [...freshStatePages, last];
              setPages(updated);
              localStorage.setItem('saved-pages', JSON.stringify(updated));
            }
            if (secondTolast && last && last.params.id === secondTolast.params.id) {
              setPages(freshStatePages);
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
            setPages(locals);
            localStorage.setItem('saved-pages', JSON.stringify(locals));
          }
        }
      }
    },
    [pages, scrollPageBack, scrollPagesBackAndSet],
  );

  const hideAddItem = useCallback(() => {
    setShowAddItem(false);
  }, []);

  const showAddItemSet = useCallback((bVal: boolean) => {
    setShowAddItem(bVal);
    if (bVal) window.scrollTo(0, 0);
  }, []);

  const logOut = useCallback(() => {
    logoutUser(() => window.location.reload());
  }, []);

  const addButtonClicked = useCallback(
    (currentShowAddItem: boolean) => {
      showAddItemSet(!currentShowAddItem);
    },
    [showAddItemSet],
  );

  const editNameSet = useCallback(() => {
    window.scrollTo(0, 0);
    setEditName((prev) => !prev);
  }, []);


  const resetPages = () => {
    setPages(DEFAULT_PAGE);
    localStorage.setItem('saved-pages', JSON.stringify(DEFAULT_PAGE));
  }

  const prepForNote = useCallback(
    (name: string) => {
      const user = localStorage.getItem('user')
      if(name !== user) resetPages()
      set({ noteName: name });
    },
    [set],
  );

  let localPages = pages;

  const isNoteNames = match?.url === '/notes/note-names';
  if (isNoteNames) {
    localPages = [{ params: { id: '' } }];
  }

  const lastPageIndex = localPages.length - 1;
  const pagesCont = (notes && noteNames)? localPages.map((pageLink, index) => {
    const lastPageShowAddItem = showAddItem && index === lastPageIndex;
    const lastPage = index === lastPageIndex;
    return (
      <NoteDetailPageItem
        {...rest}
        match={match}
        key={(pageLink?.params?.id ?? 'first') + index}
        pageLink={pageLink}
        showAddItem={lastPageShowAddItem}
        index={index}
        editName={editName}
        lastPage={lastPage}
        pageCount={localPages.length}
        hideAddItem={hideAddItem}
        openPage={openPage}
        initShowtag={pageLink}        
        set={noteDetailSet}
        searchTerm={searchTerm ?? ''}
        noteNames={noteNames}
        notes={notes}
      />
    );
  }) : null

  const showBackButton = pages.length > 1;
  return (
    <div className="slide-in" key={match.url}>
      <BackButton hasPages={pages.length > 1} onBack={scrollPageBack} onLogout={logOut} />
      {isNoteNames && (
        <Sidebar noteNames={noteNames} prepForNote={prepForNote} />
      )}
      <div id="multiple-pages">{pagesCont}</div>
      <ScrollButtons
        showBackButton={showBackButton}
        onEditName={editNameSet}
        onAdd={() => addButtonClicked(showAddItem)}
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
};

export default NoteDetailPage;
