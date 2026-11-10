import React, { useEffect, useState, useRef } from 'react';
import { Sidebar } from '../../../../shared/components/organisms/Sidebar';
import { ScrollButtons } from '../../components/ScrollButtons';
import { BackButton } from '../../../../shared/components/atoms/BackButton';

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../../core/store';
import { removeLastPage, setShowTag } from '../../../auth/store/personSlice';

import { useNoteNames } from '../../hooks/useNotesQueries';
import { useLocation } from 'react-router-dom';
import { useFolderUrlSync } from '../../hooks/useFolderUrlSync';
import { isLogId } from '../../log/useLogData';
import NoteDetail from '../../components/NoteDetail/NoteDetail';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Swiper as SwiperType } from 'swiper';
import 'swiper/css';

// Wrapper component to ensure new slides start at top
const PreservedScrollSlide: React.FC<{ children: React.ReactNode; isLog?: boolean }> = ({ children, isLog }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Force scroll to top on mount
    if (scrollRef.current) {
      scrollRef.current.scrollTo(0, 0);
    }
  }, []);

  return (
    <div
      ref={scrollRef}
      className={`multiple-pages1 scrollable-content${isLog ? ' log-slide' : ''}`}
      style={{
        height: '100%',
        overflowY: 'auto',
        paddingBottom: '15vh',
      }}
    >
      {children}
    </div>
  );
};

const NoteDetailPage: React.FC = () => {
  const { pages, authToken } = useSelector((state: RootState) => state.person);
  const dispatch = useDispatch();

  const isLoggedIn = !!authToken;
  const { data: noteNames } = useNoteNames(isLoggedIn);

  const location = useLocation();
  const isNoteNames = location.pathname === '/notes/note-names';

  useFolderUrlSync();

  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);

  // When pages change (new page added), slide to the last one
  useEffect(() => {
    if (swiperInstance && pages.length > 0) {
      swiperInstance.slideTo(pages.length - 1);
    }
  }, [pages.length, swiperInstance]);

  const handleBack = () => {
    if (swiperInstance) {
      swiperInstance.slidePrev();

      setTimeout(() => {
        dispatch(setShowTag(null));
        dispatch(removeLastPage());
      }, 350);
    } else {
      dispatch(setShowTag(null));
      dispatch(removeLastPage());
    }
  };

  if (isNoteNames) return <Sidebar />;

  return (
    <div
      className="slide-in"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: 'var(--app-h)',
        overflow: 'hidden',
        zIndex: 200,
        pointerEvents: 'none',
      }}
    >
      <div style={{ pointerEvents: 'auto' }}>
        <BackButton onCustomBack={handleBack} />
      </div>
      <div
        id="multiple-pages"
        style={{
          marginTop: 'var(--header-h)',
          width: '100%',
          height: 'calc(100% - var(--header-h))',
          pointerEvents: 'auto',
        }}
      >
        {noteNames && (
          <Swiper
            spaceBetween={0}
            slidesPerView={1}
            onSwiper={(swiper) => setSwiperInstance(swiper)}
            style={{ width: '100%', height: '100%' }}
            allowTouchMove={true}
          >
            {[...pages]?.map((page, index) => {
              return (
                <SwiperSlide key={`page-${index}`} style={{ height: '100%' }}>
                  <PreservedScrollSlide isLog={isLogId(page.params.id)}>
                    <NoteDetail index={index} />
                  </PreservedScrollSlide>
                </SwiperSlide>
              );
            })}
          </Swiper>
        )}
      </div>

      <div style={{ pointerEvents: 'auto' }}>
        <ScrollButtons />
      </div>
    </div>
  );
};

export default NoteDetailPage;
