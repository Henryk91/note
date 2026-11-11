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
  /** Note screen (notes-phone.html 2): back label only, no title; "Done" replaces the `...` menu while typing. */
  layout?: 'note' | 'menu';
  done?: (() => void) | null;
  /** Menu page (menu-login.html 1): an "×" replaces the hamburger / back button. */
  close?: (() => void) | null;
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
  const key = JSON.stringify([next.kicker, next.title, next.back?.label, next.menu?.map((m) => m.label), next.action?.ariaLabel, next.layout, !!next.done, !!next.close]);
  useEffect(() => {
    if (!enabled) return undefined;
    // Handlers go through the ref so they never act on stale props.
    const n = ref.current;
    const mine: HeaderState = {
      kicker: n.kicker,
      title: n.title,
      back: n.back ? { label: n.back.label, onClick: () => ref.current.back?.onClick() } : null,
      menu: n.menu?.map((m, i) => ({ ...m, onSelect: () => ref.current.menu?.[i]?.onSelect() })),
      action: n.action ? { ...n.action, onClick: () => ref.current.action?.onClick() } : null,
      layout: n.layout,
      done: n.done ? () => ref.current.done?.() : null,
      close: n.close ? () => ref.current.close?.() : null,
    };
    setHeader(mine);
    // Only clear the header if it is still ours: a page that unmounts must not wipe the header of the page in front.
    return () => {
      if (state === mine) setHeader({});
    };
  }, [key, enabled]);
};

/**
 * A page in the phone page stack may own the header only while it is the page in front (the last page of the stack).
 * Pages further back stay mounted in the carousel; if they could re-register (e.g. when their data arrives), the header's
 * `...` menu would act on a page that is not on screen (ui-review N1: a log's mode was changed from another log's screen).
 */
export const isFrontPage = (pages: { params: { id: string } }[], id: string, front = pages.length - 1): boolean =>
  pages.length > 0 && pages[front]?.params.id === id;

/*
 * Going back in the phone stack: the stack is only trimmed once the slide has finished moving, but the header must
 * follow the page the stack is moving to as soon as the slide starts (otherwise the old title stays up for the whole
 * transition). `backTarget` is the page index being slid back to, or null when no back move is under way.
 */
let backTarget: number | null = null;
const backListeners = new Set<() => void>();

export const setBackTarget = (index: number | null) => {
  if (backTarget === index) return;
  backTarget = index;
  backListeners.forEach((l) => l());
};

/** Index of the page that owns the header: the page being slid back to, else the last page of the stack. */
export const frontIndex = (pagesLength: number, target: number | null = backTarget): number =>
  target !== null && target >= 0 && target < pagesLength - 1 ? target : pagesLength - 1;

const subscribeBack = (l: () => void) => {
  backListeners.add(l);
  return () => {
    backListeners.delete(l);
  };
};

export const useFrontIndex = (pagesLength: number): number =>
  frontIndex(
    pagesLength,
    useSyncExternalStore(subscribeBack, () => backTarget),
  );
