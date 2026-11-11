import { useLayoutEffect, useRef, useState } from 'react';

/** Same duration as the phone page stack (Swiper's default speed), so a note moves like a folder page. */
export const NOTE_SLIDE_MS = 300;

export type NoteLayerPhase = 'opening' | 'open' | 'closing';
export type NoteLayer = { noteId: string; phase: NoteLayerPhase } | null;

/**
 * Next state of the phone note layer when the note in the URL changes. A note opened while its folder page is on
 * screen slides in; leaving it slides it out (it stays rendered until the slide has finished). A note that is already
 * in the URL when the page mounts (deep link, reload, search hit opening a new page) is shown at once.
 */
export const nextNoteLayer = (
  prev: NoteLayer,
  target: string | null,
): NoteLayer => {
  if (target) {
    if (!prev || prev.phase === 'closing')
      return { noteId: target, phase: 'opening' };
    return prev.noteId === target ? prev : { ...prev, noteId: target };
  }
  if (!prev || prev.phase === 'closing') return prev;
  return { ...prev, phase: 'closing' };
};

export const useNoteLayer = (target: string | null): NoteLayer => {
  const [layer, setLayer] = useState<NoteLayer>(() =>
    target ? { noteId: target, phase: 'open' } : null,
  );
  const first = useRef(true);

  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setLayer((prev) => nextNoteLayer(prev, target));
  }, [target]);

  const phase = layer?.phase;
  useLayoutEffect(() => {
    if (phase !== 'opening' && phase !== 'closing') return undefined;
    const t = setTimeout(
      () =>
        setLayer((prev) =>
          prev?.phase === 'opening'
            ? { ...prev, phase: 'open' }
            : prev?.phase === 'closing'
              ? null
              : prev,
        ),
      NOTE_SLIDE_MS,
    );
    return () => clearTimeout(t);
  }, [phase]);

  return layer;
};
