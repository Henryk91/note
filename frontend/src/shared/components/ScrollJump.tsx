import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconArrowDown, IconArrowUp } from '@tabler/icons-react';
import './scrollJump.css';

/** Lists longer than this get the jump button. */
export const SCROLL_JUMP_MIN = 25;

/** The direction the button jumps: down to the end while in the top half of the list, otherwise up to the start. */
export const jumpDirection = (scrollTop: number, scrollHeight: number, clientHeight: number): 'down' | 'up' =>
  scrollTop + clientHeight / 2 < scrollHeight / 2 ? 'down' : 'up';

const findScroller = (el: HTMLElement | null): HTMLElement | null => {
  let node = el?.parentElement ?? null;
  while (node) {
    const { overflowY } = getComputedStyle(node);
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) return node;
    node = node.parentElement;
  }
  return null;
};

/**
 * Round button pinned to the bottom right of a long list (more than 25 items): jumps to the end of the list, or back
 * to the start once past the middle. Put it as the last child inside the scrolling content; `bottom` lifts it above
 * a fixed bar (e.g. the phone bottom toolbar).
 */
export const ScrollJump: React.FC<{
  count: number;
  bottom?: string;
  /** Fixed on the screen (portal) and scrolling this element, for pages inside the transformed phone swiper. */
  fixedScroller?: () => HTMLElement | null;
}> = ({ count, bottom = '12px', fixedScroller }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [dir, setDir] = useState<'down' | 'up'>('down');
  const show = count > SCROLL_JUMP_MIN;
  const scrollerOf = () => (fixedScroller ? fixedScroller() : findScroller(ref.current));

  useEffect(() => {
    if (!show) return undefined;
    const update = () => {
      const sc = scrollerOf();
      if (sc) setDir(jumpDirection(sc.scrollTop, sc.scrollHeight, sc.clientHeight));
    };
    // Scroll events do not bubble, but the capture phase on document sees every scroller; the active list is looked
    // up each time, so the right page is tracked even while the phone stack is still sliding in.
    const onScroll = (e: Event) => {
      if (e.target === scrollerOf()) update();
    };
    const t = setTimeout(update, 400);
    update();
    document.addEventListener('scroll', onScroll, { capture: true, passive: true });
    return () => {
      clearTimeout(t);
      document.removeEventListener('scroll', onScroll, { capture: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, count]);

  if (!show) return null;
  const jump = () => {
    const scroller = scrollerOf();
    if (!scroller) return;
    scroller.scrollTo({ top: dir === 'down' ? scroller.scrollHeight : 0, behavior: 'smooth' });
  };
  const button = (
    <button type="button" className="scroll-jump-btn" onClick={jump} aria-label={dir === 'down' ? 'Scroll to the bottom' : 'Scroll to the top'}>
      {dir === 'down' ? <IconArrowDown size={20} /> : <IconArrowUp size={20} />}
    </button>
  );
  if (fixedScroller) {
    return createPortal(
      <div className="scroll-jump is-fixed" style={{ bottom }}>
        {button}
      </div>,
      document.body,
    );
  }
  return (
    <div className="scroll-jump" ref={ref} style={{ bottom }}>
      {button}
    </div>
  );
};
