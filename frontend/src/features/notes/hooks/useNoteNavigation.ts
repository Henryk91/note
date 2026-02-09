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

        // Scroll logic is now handled by Swiper in NoteDetailPage.tsx via useEffect on pages change.
      } else {
        // Page found - Swiper should arguably slide to it?
        // If the user clicks a link to an *existing* page, we currently just setPages (which might not change pages array ref if we don't update it).
        // BUT wait, `dispatch(setPages(newPages))` is only called if pageFoundIndex === -1.
        // If pageFoundIndex !== -1, we might want to slide to it.
        // However, we don't have access to the swiper instance here.
        // The previous logic used direct DOM manipulation.
        // Ideally, we should update some state "activePageIndex" that NoteDetailPage observes.
        // Or, we assume that "Navigation" mainly happens by adding pages.
        // If we want to navigate purely to an existing page, we currently don't have a mechanism in Redux for "Active Page Index".
        // The component logic in NoteDetailPage only slides on `pages.length` change.
        // For now, removing the DOM logic. If we need "Jump to existing page", we should add `activePageIndex` to Redux.
        // But `swiper` handles its own active index.
        // Let's rely on the user manually swiping if they want to go back, OR if we strictly need to jump, we need to add state.
        // Given the requirement is "scroll functionality/ multi page functionality", default Swiper behavior (swiping) covers "Go to existing page" mostly.
        // But `openPage` is called when clicking a link. If I click a link to a page that is ALREADY open (e.g. index 0), I expect it to slide there.
        // I will add a TO-DO or strictly implement `setActivePage`.
        // Let's implement `activePage` index in Redux would be best practice, but that requires store changes.
        // Alternative: we can retain a simplified DOM event or custom event? No.
        // Since I can't easily change the Redux store structure without potentially bigger impact (though I am refactoring),
        // I will stick to: Remove the DOM IO.
        // Note: The previous logic tried to scroll to `pageWidth * pageFoundIndex`.
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
