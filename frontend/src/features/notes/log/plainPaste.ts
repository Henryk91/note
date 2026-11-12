import React from 'react';

/**
 * Text like "Go: 29/29 NoGO: 17/18" looks like a link ("go:" as the scheme), so iOS and some apps put it on the
 * clipboard as a URL too, and a normal paste inserts the link form: "go:%2029/29%20NoGO:%2017/18".
 * Paste the plain text instead (the old entry box did the same with navigator.clipboard.readText).
 */
export const looksUrlMangled = (s: string) => /^[a-z][a-z0-9+.-]*:\S*%20/i.test(s) && !/\s/.test(s);

const decodeSafely = (s: string) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s.replace(/%20/g, ' ');
  }
};

export const plainPasteHandler =
  (text: string, onText: (v: string) => void, inputRef: React.RefObject<HTMLTextAreaElement>) =>
  (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const fromEvent = e.clipboardData?.getData('text/plain') ?? '';
    const uriList = e.clipboardData?.getData('text/uri-list') ?? '';
    // A normal paste is left alone unless it carries a link form.
    if (!uriList && !looksUrlMangled(fromEvent)) return;
    e.preventDefault();
    const el = e.currentTarget;
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    const insert = (plain: string) => {
      const next = text.slice(0, start) + plain + text.slice(end);
      onText(next);
      requestAnimationFrame(() => {
        const box = inputRef.current;
        if (box) box.selectionStart = box.selectionEnd = start + plain.length;
      });
    };
    const fallback = looksUrlMangled(fromEvent) ? decodeSafely(fromEvent) : fromEvent;
    const read = navigator.clipboard?.readText?.();
    if (!read) {
      insert(fallback);
      return;
    }
    read.then(
      (t) => insert(t && !looksUrlMangled(t) ? t : fallback),
      () => insert(fallback),
    );
  };
