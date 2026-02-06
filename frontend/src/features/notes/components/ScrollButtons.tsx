import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowDown, faArrowUp, faPen, faPlus, faWifi } from '@fortawesome/free-solid-svg-icons';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { RootState } from '../../../core/store';
import { setEditName, setShowAddItem } from '../../../features/auth/store/personSlice';
import { useOnlineStatus } from '../../../shared/hooks/useOnlineStatus';

export type ScrollButtonsProps = {
};

export const ScrollButtons: React.FC<ScrollButtonsProps> = ({}) => {
  const isOnline = useOnlineStatus();
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.theme.themeLower);
  const { showAddItem, editName, pages } = useSelector((state: RootState) => state.person);
  const showUpdateButton = pages.length > 1;
  const themeBack = `${theme}-back`;
  const themeHover = `${theme}-hover`;

  const addButtonClicked = () => {
    dispatch(setShowAddItem(!showAddItem));
    if (!showAddItem) window.scrollTo(0, 0);
  };

  const editNameClick = () => {
    window.scrollTo(0, 0);
    dispatch(setEditName(!editName));
  };

  return (
    <div className="detail-scroll">
      {!isOnline && (
        <div className={`detailUpButton ${themeHover} ${themeBack}`} style={{ color: 'red' }}>
          <FontAwesomeIcon icon={faWifi} size="lg" />
        </div>
      )}
      <button className={`editButtons1 detailUpButton ${themeHover} ${themeBack}`} onClick={editNameClick}>
        <FontAwesomeIcon icon={faPen} />
      </button>
      <div
        className={`detailUpButton ${themeHover} ${themeBack}`}
        onClick={() => {
          window.scrollTo(0, 0);
        }}
      >
        <FontAwesomeIcon icon={faArrowUp} size="lg" />
      </div>
      <div
        className={`detailUpButton ${themeHover} ${themeBack}`}
        onClick={() => {
          window.scrollBy(0, document.body.scrollHeight);
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
