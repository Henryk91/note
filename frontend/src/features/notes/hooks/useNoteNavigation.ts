import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../core/store';
import { setPages, setShowTag } from '../../auth/store/personSlice';
import { Note, PageDescriptor } from '../../../shared/utils/Helpers/types';

type UseNoteNavigationProps = {
  person: Note | null;
  isLastPage: boolean;
};

export const useNoteNavigation = ({ person, isLastPage }: UseNoteNavigationProps) => {
  const dispatch = useDispatch();
  const { pages, showTag } = useSelector((state: RootState) => state.person);

  const clearShowTag = useCallback(() => {
    localStorage.removeItem('showTag');
    dispatch(setShowTag(null));
  }, [dispatch]);

  const saveShowTag = useCallback(
    (tagName: string) => {
      if (!person) return;
      dispatch(setShowTag(tagName));
    },
    [dispatch, person],
  );

  const openPage = useCallback(
    (msg: any) => {
      if (!msg.personNext) return;

      const heading = msg.personNext.heading || msg.personNext.name || msg.personNext.id;
      const tempId = `${msg.personNext.id}-${heading}`;
      const nextPage: PageDescriptor = { params: { id: msg.personNext.id, tempId } };

      const pageFoundIndex = pages.findIndex((page) => page.params.id === msg.personNext.id);

      // If page is not found, add it to the stack
      if (pageFoundIndex === -1) {
        // If we are coming from a parent, we might want to truncate the stack to that parent
        const parentPageIndex = pages.findIndex((page) => page.params.id === msg.parentId);
        let basePages = pages;
        if (parentPageIndex > -1) {
          basePages = pages.slice(0, parentPageIndex + 1);
        }

        const newPages =
          basePages.length === 1 && basePages[0].params.id === '' ? [nextPage] : [...basePages, nextPage];

        dispatch(setPages(newPages));

        // Scroll logic
        const noteDetailPage = document.getElementById('multiple-pages');
        if (noteDetailPage) {
          const scrollOptions: ScrollToOptions = {
            left: noteDetailPage.scrollWidth,
            behavior: 'smooth',
          };
          console.log('wdcwec');
          noteDetailPage.scrollTo(scrollOptions);

          // Fallback
          setTimeout(() => {
            window.scrollTo({ top: 0 });
            if (noteDetailPage.scrollLeft < noteDetailPage.scrollWidth - noteDetailPage.clientWidth) {
              noteDetailPage.scrollTo(scrollOptions);
            }
          }, 20);
        }
      } else {
        // Page found - just scroll to it
        const noteDetailPage = document.getElementById('multiple-pages');
        if (noteDetailPage) {
          const pageWidth = noteDetailPage.scrollWidth / pages.length;
          noteDetailPage.scrollTo({
            left: pageWidth * pageFoundIndex,
            behavior: 'smooth',
          });
        }
      }
    },
    [pages, dispatch],
  );

  const openDetailOnNewPage = useCallback(
    (personParam: Note | null) => {
      if (!personParam) return;
      const parentId = personParam.id;

      openPage({
        personNext: personParam,
        parentId,
        showNote: true,
        hideNote: true,
      });
    },
    [openPage],
  );

  const handleLinkClick = useCallback(
    (tagData: any, currentPerson: any) => {
      openPage({
        personNext: { id: tagData.id, heading: tagData.name || tagData.heading },
        parentId: currentPerson.id,
        hideNote: true,
      });
    },
    [openPage],
  );

  const showTagChange = useCallback(
    (tagName: string) => {
      const localPerson = person;

      // Robust lookup for tagData - check name, heading and id
      const tagData = localPerson?.dataLable?.find(
        (note) => note.name === tagName || note.heading === tagName || note.id === tagName,
      );

      dispatch(setShowTag(tagName));

      if (tagData?.type === 'FOLDER' || tagData?.id?.includes('FOLDER')) {
        handleLinkClick(tagData, localPerson);
      } else {
        const sessionShowTag = localStorage.getItem('showTag');
        if (isLastPage) {
          openDetailOnNewPage(localPerson);
        } else if (sessionShowTag && tagName && sessionShowTag !== tagName) {
          openPage({
            personNext: localPerson,
            parentId: localPerson?.id,
            showNote: true,
            hideNote: tagName === '',
          });
        } else {
          clearShowTag();
          openDetailOnNewPage(localPerson);
        }
      }
    },
    [person, isLastPage, dispatch, handleLinkClick, openDetailOnNewPage, openPage, clearShowTag],
  );

  const showHideBox = useCallback(
    (prop: string) => {
      if (prop !== 'Log') showTagChange(prop);
    },
    [showTagChange],
  );

  return {
    pages,
    showTag,
    clearShowTag,
    saveShowTag,
    openPage,
    openDetailOnNewPage,
    handleLinkClick,
    showTagChange,
    showHideBox,
  };
};
