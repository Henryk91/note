import { IconDots } from '@tabler/icons-react';
import React, { useLayoutEffect, useRef, useState } from 'react';
import { useDismiss } from './useDismiss';

export type ItemMenuEntry = { label: string; onSelect: () => void; danger?: boolean };

/** A `...` button with a small menu. Destructive entries are separate rows, never next to a Save button. */
export const ItemMenu: React.FC<{ label: string; items: ItemMenuEntry[] }> = ({ label, items }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useDismiss(open, ref, () => setOpen(false));

  // Opens downwards; flips upwards when the list would run under the bottom toolbar / off the screen.
  const [up, setUp] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!open) {
      setUp(false);
      return;
    }
    const list = listRef.current;
    const btn = ref.current;
    if (!list || !btn) return;
    const limit = window.innerHeight - (document.querySelector('.bottom-toolbar')?.getBoundingClientRect().height ?? 0) - 8;
    const below = list.getBoundingClientRect().bottom;
    const spaceAbove = btn.getBoundingClientRect().top;
    if (below > limit && spaceAbove > list.getBoundingClientRect().height) setUp(true);
  }, [open]);

  return (
    <span ref={ref} className="item-menu">
      <button type="button" className="item-menu-btn" aria-label={label} aria-haspopup="menu" aria-expanded={open} onClick={(e) => {
          e.stopPropagation(); // do not also select / open the row this menu sits in
          setOpen((v) => !v);
        }}
      >
        <IconDots size={20} />
      </button>
      {open && (
        <div className={`item-menu-list ${up ? 'is-up' : ''}`} role="menu" ref={listRef}>
          {items.map((it) => (
            <button
              type="button"
              role="menuitem"
              key={it.label}
              className={it.danger ? 'danger' : ''}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                it.onSelect();
              }}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </span>
  );
};
