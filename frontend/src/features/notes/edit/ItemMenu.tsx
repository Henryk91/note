import { IconDots } from '@tabler/icons-react';
import React, { useEffect, useRef, useState } from 'react';

export type ItemMenuEntry = { label: string; onSelect: () => void; danger?: boolean };

/** A `...` button with a small menu. Destructive entries are separate rows, never next to a Save button. */
export const ItemMenu: React.FC<{ label: string; items: ItemMenuEntry[] }> = ({ label, items }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
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
        <div className="item-menu-list" role="menu">
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
