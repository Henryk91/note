import React, { useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faPowerOff } from '@fortawesome/free-solid-svg-icons';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../core/store';
import { logoutUser } from '../../utils/Helpers/requests';
import { removeLastPage, setShowTag } from '../../../features/auth/store/personSlice';

export type BackButtonProps = {
  onCustomBack?: () => void;
};

export const BackButton: React.FC<BackButtonProps> = ({ onCustomBack }) => {
  const dispatch = useDispatch();

  const onLogout = () => logoutUser(() => window.location.reload());

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
