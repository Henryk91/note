import React, { useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faPowerOff } from '@fortawesome/free-solid-svg-icons';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../core/store';
import { logoutUser } from '../../utils/Helpers/requests';
import { removeLastPage, setShowTag } from '../../../features/auth/store/personSlice';

export type BackButtonProps = {};

export const BackButton: React.FC<BackButtonProps> = () => {
  const dispatch = useDispatch();

  const onLogout = () => logoutUser(() => window.location.reload());


  const { pages } = useSelector((state: RootState) => state.person);

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

    const onBack = useCallback(() => {
      if (pages && pages.length > 1) {
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
    }, [customScrollBy, pages, dispatch]);

  const theme = useSelector((state: RootState) => state.theme.themeLower);
  const themeBack = `${theme}-back`;
  const hasPages = pages?.length > 1
  const icon: IconProp = hasPages ? faArrowLeft : faPowerOff;
  const handleClick = () => {
    if (hasPages) onBack();
    else onLogout();
  };
  return (
    <button className={`backButton ${themeBack}`} onClick={handleClick}>
      <FontAwesomeIcon icon={icon} />
    </button>
  );
};
