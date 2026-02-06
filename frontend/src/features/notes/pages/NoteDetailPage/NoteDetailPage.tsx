import React, { useEffect } from 'react';
import { Sidebar } from '../../../../shared/components/organisms/Sidebar';
import { ScrollButtons } from '../../components/ScrollButtons';
import { BackButton } from '../../../../shared/components/atoms/BackButton';

import { useSelector } from 'react-redux';
import { RootState } from '../../../../core/store';

import { useNoteNames } from '../../hooks/useNotesQueries';
import { useLocation } from 'react-router-dom';
import NoteDetail from '../../components/NoteDetail/NoteDetail';

type NoteDetailPageProps = {};

const NoteDetailPage: React.FC<NoteDetailPageProps> = ({}) => {
  const { pages } = useSelector((state: RootState) => state.person);

  const loginKey = typeof window !== 'undefined' || localStorage.getItem('loginKey');
  const isLoggedIn = !!loginKey;
  const { data: noteNames } = useNoteNames(isLoggedIn);

  const location = useLocation();
  const isNoteNames = location.pathname === '/notes/note-names';

  useEffect(() => {
    const noteDetailPage = document.getElementById('multiple-pages');
    setTimeout(() => {
      if (noteDetailPage)  noteDetailPage.scrollTo({left: noteDetailPage.scrollWidth});
    }, 1);
  }, [location.pathname]);

  const el = document.querySelector('.multiple-pages1') as HTMLElement | null;
  const pageMinWidth = el?.offsetWidth || window.innerWidth;

  if(isNoteNames) return <Sidebar />

  return (
    <div className="slide-in" key={location.pathname}>
      <BackButton />
      <div id="multiple-pages">
        {noteNames &&
          [...pages]?.map((page, index) => {
            return (
              <div className="multiple-pages1" key={`page-${index}`} style={{ minWidth: `${pageMinWidth}px` }}>
                <NoteDetail index={index} />
              </div>
            );
          })}
      </div>
      <ScrollButtons />
    </div>
  );
};

export default NoteDetailPage;
