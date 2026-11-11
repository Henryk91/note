import { RefObject, useEffect } from 'react';

/**
 * Closes a popup (menu, calendar, revealed Delete) when the user presses or taps anywhere outside of it, or hits Esc.
 * Listens in the capture phase on `pointerdown`, so carousels or other handlers that stop events cannot swallow it.
 */
export const useDismiss = (open: boolean, ref: RefObject<HTMLElement>, onClose: () => void) => {
  useEffect(() => {
    if (!open) return undefined;
    const outside = (e: Event) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('pointerdown', outside, true);
    document.addEventListener('mousedown', outside, true);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', outside, true);
      document.removeEventListener('mousedown', outside, true);
      document.removeEventListener('keydown', esc);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ref]);
};
