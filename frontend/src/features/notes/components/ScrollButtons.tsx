import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowDown, faArrowUp, faClock, faPlus, faWifi } from '@fortawesome/free-solid-svg-icons';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { RootState } from '../../../core/store';
import { setShowAddItem } from '../../../features/auth/store/personSlice';
import { useOnlineStatus } from '../../../shared/hooks/useOnlineStatus';
import { scrollActiveSlideToTop } from '../../../shared/utils/Helpers/utils';
import { isLogId } from '../log/useLogData';
import { QUICK_LOG_EVENT } from '../log/QuickLogSheet';

export type ScrollButtonsProps = {};

export const ScrollButtons: React.FC<ScrollButtonsProps> = ({}) => {
  const isOnline = useOnlineStatus();
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.theme.themeLower);
  const { showAddItem, pages } = useSelector((state: RootState) => state.person);
  const showUpdateButton = pages.length > 1;
  const themeBack = `${theme}-back`;
  const themeHover = `${theme}-hover`;

  const addButtonClicked = () => {
    dispatch(setShowAddItem(!showAddItem));
    if (!showAddItem) scrollActiveSlideToTop();
  };

  // The log screen has its own pinned entry box at the bottom; floating buttons would cover it.
  if (isLogId(pages[pages.length - 1]?.params.id)) return null;

  return (
    <div className="detail-scroll">
      {!isOnline && (
        <div className={`detailUpButton ${themeHover} ${themeBack}`} style={{ color: 'red' }}>
          <FontAwesomeIcon icon={faWifi} size="lg" />
        </div>
      )}
      <button
        className={`detailUpButton ${themeHover} ${themeBack}`}
        onClick={() => window.dispatchEvent(new Event(QUICK_LOG_EVENT))}
        aria-label="Quick log"
        title="Quick log"
      >
        <FontAwesomeIcon icon={faClock} />
      </button>
      <div className={`detailUpButton ${themeHover} ${themeBack}`} onClick={scrollActiveSlideToTop}>
        <FontAwesomeIcon icon={faArrowUp} size="lg" />
      </div>
      <div
        className={`detailUpButton ${themeHover} ${themeBack}`}
        onClick={() => {
          const activeSlide = document.querySelector('.swiper-slide-active .scrollable-content');
          if (activeSlide) {
            activeSlide.scrollBy({ top: activeSlide.scrollHeight });
          } else {
            window.scrollBy(0, document.body.scrollHeight);
          }
        }}
      >
        <FontAwesomeIcon icon={faArrowDown} size="lg" />
      </div>
      {!showUpdateButton ? (
        <div className={`detailAddButton ${themeHover} ${themeBack}`}>
          <Link style={{ textDecoration: 'none', color: 'white' }} to="/new-note/">
            <FontAwesomeIcon icon={faPlus} />
          </Link>
        </div>
      ) : (
        <div className={`detailAddButton ${themeHover} ${themeBack}`} onClick={() => addButtonClicked()}>
          <FontAwesomeIcon icon={faPlus} />
        </div>
      )}
    </div>
  );
};
