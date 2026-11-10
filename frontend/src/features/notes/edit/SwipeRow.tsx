import React, { useRef, useState } from 'react';

const REVEAL = 88;

/**
 * Swipe a row left (touch) to reveal Delete; right-click opens the same action. Keeps the row itself untouched, so
 * the wrapped list rows keep their markup.
 */
export const SwipeRow: React.FC<{ onDelete: () => void; children: React.ReactNode }> = ({ onDelete, children }) => {
  const [dx, setDx] = useState(0);
  const start = useRef<{ x: number; y: number; base: number } | null>(null);
  const horizontal = useRef(false);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    start.current = { x: t.clientX, y: t.clientY, base: dx };
    horizontal.current = false;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const s = start.current;
    if (!s) return;
    const t = e.touches[0];
    const mx = t.clientX - s.x;
    const my = t.clientY - s.y;
    if (!horizontal.current && Math.abs(mx) > 12 && Math.abs(mx) > Math.abs(my)) horizontal.current = true;
    if (horizontal.current) setDx(Math.max(-REVEAL, Math.min(0, s.base + mx)));
  };
  const onTouchEnd = () => {
    start.current = null;
    setDx((v) => (v < -REVEAL / 2 ? -REVEAL : 0));
  };

  return (
    <div
      className="swipe-row swiper-no-swiping"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onContextMenu={(e) => {
        e.preventDefault();
        setDx(dx === 0 ? -REVEAL : 0);
      }}
    >
      <button
        type="button"
        className="swipe-row-delete"
        aria-label="Delete"
        tabIndex={dx === 0 ? -1 : 0}
        onClick={() => {
          setDx(0);
          onDelete();
        }}
      >
        Delete
      </button>
      <div className="swipe-row-content" style={{ transform: `translateX(${dx}px)` }}>
        {children}
      </div>
    </div>
  );
};
