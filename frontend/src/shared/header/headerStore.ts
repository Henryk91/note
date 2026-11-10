import { useEffect, useRef, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import type { ItemMenuEntry } from '../../features/notes/edit/ItemMenu';

/** What the page currently on screen wants in the app header (back label, two-line title, `...` menu, extra button). */
export type HeaderState = {
  kicker?: string;
  title?: string;
  back?: { label: string; onClick: () => void } | null;
  menu?: ItemMenuEntry[];
  action?: { icon: ReactNode; ariaLabel: string; onClick: () => void } | null;
};

let state: HeaderState = {};
const listeners = new Set<() => void>();

export const setHeader = (next: HeaderState) => {
  state = next;
  listeners.forEach((l) => l());
};

export const useHeaderState = (): HeaderState =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );

/** A page registers its header while it is mounted (and `enabled`); the next page replaces it. */
export const useHeader = (next: HeaderState, enabled = true) => {
  const ref = useRef(next);
  ref.current = next;
  const key = JSON.stringify([next.kicker, next.title, next.back?.label, next.menu?.map((m) => m.label), next.action?.ariaLabel]);
  useEffect(() => {
    if (!enabled) return undefined;
    // Handlers go through the ref so they never act on stale props.
    const n = ref.current;
    setHeader({
      kicker: n.kicker,
      title: n.title,
      back: n.back ? { label: n.back.label, onClick: () => ref.current.back?.onClick() } : null,
      menu: n.menu?.map((m, i) => ({ ...m, onSelect: () => ref.current.menu?.[i]?.onSelect() })),
      action: n.action ? { ...n.action, onClick: () => ref.current.action?.onClick() } : null,
    });
    return () => setHeader({});
  }, [key, enabled]);
};
