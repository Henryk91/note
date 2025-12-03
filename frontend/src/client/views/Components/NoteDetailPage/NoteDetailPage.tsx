import React, { useCallback, useEffect, useState } from 'react';
import { logoutUser } from '../../Helpers/requests';
import { Match, PageDescriptor } from '../../Helpers/types';
import {
  NoteDetailPageItem,
  Sidebar,
  ScrollButtons,
  BackButton,
} from './NoteDetailPageParts';


import { useDispatch, useSelector } from 'react-redux';
import { removePersonById, setPersonById, setShowTag, removeLastPage, resetPages, setEditName, setShowAddItem, setPages } from '../../../../store/personSlice';
import { RootState } from '../../../../store';


type NoteDetailPageProps = {
  set: (payload: any) => void;
  searchTerm?: string;
  match: Match;
};

const NoteDetailPage: React.FC<NoteDetailPageProps> = ({
  match,
  searchTerm,
  set
}) => {
  const { notes, noteNames, showAddItem, editName, pages} = useSelector((state: RootState) => state.person);
  const dispatch = useDispatch();

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
          dispatch(setPages(nextPages));
        }, 50);
      }
    },
    [customScrollBy],
  );

  const scrollPageBack = useCallback(() => {
    // console.log('scrollPageBack', pages);
    if (pages && pages.length > 1) {
      setTimeout(() => {
        dispatch(removePersonById({id: `${pages.length -1}`}))
      }, 350)
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
        dispatch(setShowTag(null));
        dispatch(removeLastPage());
      }, 350);
    }
  }, [customScrollBy, pages]);

  const openPage = useCallback(
    (msg: any) => {
      console.log('msgmsgmsgmsgmsg', msg);
      if (!msg.personNext) return;
      // cll
      const tempId = `${msg.personNext.id}-${msg.personNext.heading}`
      // if(msg?.personNext) dispatch(setPersonById({ id: tempId, person: {...msg?.personNext} }));

      const nextPage = { params: { id: msg.personNext.id, tempId: tempId } };
      console.log('nextPage',nextPage);
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
      // console.log('pageFoundIndex',pageFoundIndex);
      if (pageFoundIndex === -1) {
        // New Page not in pages
        const newPages =
          updatePages.length === 1 && updatePages[0].params.id === '' ? [nextPage] : [...updatePages, nextPage];
        // console.log('newPages',newPages);
        dispatch(setPages(newPages));
      } else if (pageFoundIndex > -1 && !msg.showNote) {
        // console.log('pageFoundIndex > -1 && !msg.showNote',pageFoundIndex > -1 && !msg.showNote);
        // New Page in pages but not open note
        const localPageFoundIndex = pageFoundIndex === 0 ? 1 : pageFoundIndex;
        const newPages = updatePages.slice(0, localPageFoundIndex);
        if (pageFoundIndex + 1 === updatePages.length) {
          // console.log('scrollPageBackscrollPageBackscrollPageBack');
          scrollPageBack();
        } else {
          // console.log('scrollPagesBackAndSetscrollPagesBackAndSetscrollPagesBackAndSet');
          scrollPagesBackAndSet(updatePages.length, updatePages.length - pageFoundIndex, newPages);
        }
      } else if (pageFoundIndex > -1) {
        // New Page in pages Should show note
        const freshStatePages = [...pages];
        const newPageIsLast = pageFoundIndex === freshStatePages.length - 1;
        if (newPageIsLast) {
          if (freshStatePages.length + 1 === freshStatePages.length && msg.hideNote) {
            scrollPageBack();
          } else {
            const last = freshStatePages[freshStatePages.length - 1];
            const secondTolast = freshStatePages[freshStatePages.length - 2];

            if (secondTolast && last && last.params.id !== secondTolast.params.id) {
              const updated = [...freshStatePages, last];
              // console.log('updatedupdatedupdated');
              dispatch(setPages(updated));
            }
            if (secondTolast && last && last.params.id === secondTolast.params.id) {
              // console.log('freshStatePagesfreshStatePagesfreshStatePages',);
              dispatch(setPages(freshStatePages))
            }
          }
        }

        const localPages = localStorage.getItem('saved-pages');

        if (msg.showNote && !msg.hideNote) {
          const locals = localPages ? JSON.parse(localPages) : [];
          const last = locals[locals.length - 1];
          const secondTolast = locals[locals.length - 2];

          if (secondTolast && last && last.params.id === secondTolast.params.id) {
            // console.log('localslocalslocals');
            dispatch(setPages(locals));
          }
        }
      }
    },
    [pages, scrollPageBack, scrollPagesBackAndSet],
  );

  const logOut = useCallback(() => {
    logoutUser(() => window.location.reload());
  }, []);

  const prepForNote = useCallback(
    (name: string) => {
      const user = localStorage.getItem('user')
      if(name !== user) dispatch(resetPages());
      set({ noteName: name });
    },
    [set],
  );

  let localPages = pages;

  const isNoteNames = match?.url === '/notes/note-names';
  if (isNoteNames) {
    localPages = [{ params: { id: '', tempId: '' } }];
  }

  const lastPageIndex = localPages.length - 1;
  // console.error('localPages', localPages);
  // const pagesCont = (notes && noteNames)? localPages.map((pageLink, index) => {
  const pagesCont = (localPages && noteNames)? localPages.map((pageLink, index) => {
    const lastPageShowAddItem = showAddItem && index === lastPageIndex;
    const lastPage = index === lastPageIndex;
    // console.log(index, 'pageLink',pageLink);
    return (
      <NoteDetailPageItem
        match={match}
        key={(pageLink?.params?.id ?? 'first') + index}
        pageLink={pageLink}
        showAddItem={lastPageShowAddItem}
        index={index}
        editName={editName}
        lastPage={lastPage}
        pageCount={localPages.length}
        openPage={openPage}
        initShowtag={pageLink}        
        set={set}
        searchTerm={searchTerm ?? ''}
      />
    );
  }) : null

  const showBackButton = pages.length > 1;
  return (
    <div className="slide-in" key={match.url}>
      <BackButton hasPages={pages.length > 1} onBack={scrollPageBack} onLogout={logOut} />
      {isNoteNames && (
        <Sidebar prepForNote={prepForNote} />
      )}
      <div id="multiple-pages">{pagesCont}</div>
      <ScrollButtons showBackButton={showBackButton} />
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
