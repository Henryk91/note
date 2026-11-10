import React, { useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { RootState } from '../../../core/store';
import { removeLastPage, setShowTag } from '../../../features/auth/store/personSlice';

export type BackButtonProps = {
  onCustomBack?: () => void;
  /** Always show the button and go to this path (for pages outside the folder stack, e.g. Memento). */
  toPath?: string;
};

export const BackButton: React.FC<BackButtonProps> = ({ onCustomBack, toPath }) => {
  const dispatch = useDispatch();
  const history = useHistory();

  const { pages } = useSelector((state: RootState) => state.person);

  const onBack = useCallback(() => {
    if (onCustomBack) {
      onCustomBack();
      return;
    }

    if (pages && pages.length > 1) {
      dispatch(setShowTag(null));
      dispatch(removeLastPage());
    }
  }, [pages, dispatch, onCustomBack]);

  const theme = useSelector((state: RootState) => state.theme.themeLower);
  const themeBack = `${theme}-back`;
  const hasPages = pages?.length > 1;

  // Back never turns into Logout: at the root there is simply no back button (Logout lives in the menu).
  if (!hasPages && !toPath) return null;

  return (
    <button
      className={`backButton ${themeBack}`}
      onClick={toPath ? () => history.push(toPath) : onBack}
      aria-label="Back"
      title="Back"
    >
      <FontAwesomeIcon icon={faArrowLeft} />
    </button>
  );
};
