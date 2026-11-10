import React, { useEffect, useState, useRef } from 'react';
import { Sidebar } from '../../../../shared/components/organisms/Sidebar';
import { BottomToolbar } from '../../layout/BottomToolbar';

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../../core/store';
import { removeLastPage, setPages, setShowTag } from '../../../auth/store/personSlice';

import { useNoteNames } from '../../hooks/useNotesQueries';
import { useLocation } from 'react-router-dom';
import { useBreakpoint } from '../../layout/useBreakpoint';
import { DesktopLayout } from '../../layout/DesktopLayout';
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
        boxSizing: 'border-box',
        overflowY: 'auto',
        paddingBottom: 'calc(var(--toolbar-h) + env(safe-area-inset-bottom, 0px) + 24px)',
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

  const breakpoint = useBreakpoint();
  useFolderUrlSync({ selectionMode: breakpoint !== 'mobile' });

  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);

  // When pages change (new page added), slide to the last one
  useEffect(() => {
    if (swiperInstance && pages.length > 0) {
      swiperInstance.slideTo(pages.length - 1);
    }
  }, [pages.length, swiperInstance]);

  const handleBack = () => {
    if (swiperInstance) {
      // The stack is trimmed when the slide has finished moving (see onSlideChangeTransitionEnd), which also covers
      // swiping back with a finger.
      swiperInstance.slidePrev();
    } else {
      dispatch(setShowTag(null));
      dispatch(removeLastPage());
    }
  };

  useEffect(() => {
    const back = () => handleBack();
    window.addEventListener('page-back', back);
    return () => window.removeEventListener('page-back', back);
  });

  if (isNoteNames) return <Sidebar />;

  // Wide screens: sidebar + list + editor instead of the stacked pages.
  if (breakpoint !== 'mobile') return <DesktopLayout breakpoint={breakpoint} />;

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
            onSlideChangeTransitionEnd={(swiper) => {
              if (swiper.activeIndex < pages.length - 1) {
                dispatch(setShowTag(null));
                dispatch(setPages(pages.slice(0, swiper.activeIndex + 1)));
              }
            }}
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
        <BottomToolbar />
      </div>
    </div>
  );
};

export default NoteDetailPage;
