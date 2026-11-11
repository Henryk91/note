import { act, renderHook } from '@testing-library/react';
import { nextNoteLayer, NOTE_SLIDE_MS, useNoteLayer } from '../src/features/notes/editor/useNoteLayer';

// Phone: opening and closing a note moves like opening and closing a folder page (slide in from the right, slide out).
describe('note layer: notes slide in and out like folder pages', () => {
  test('nextNoteLayer', () => {
    expect(nextNoteLayer(null, 'n1')).toEqual({ noteId: 'n1', phase: 'opening' });
    expect(nextNoteLayer({ noteId: 'n1', phase: 'open' }, null)).toEqual({ noteId: 'n1', phase: 'closing' });
    // A new note getting its id keeps its screen (no second slide).
    expect(nextNoteLayer({ noteId: 'new', phase: 'open' }, 'n2')).toEqual({ noteId: 'n2', phase: 'open' });
    // Opening a note again while the last one is still sliding out slides the new one in.
    expect(nextNoteLayer({ noteId: 'n1', phase: 'closing' }, 'n3')).toEqual({ noteId: 'n3', phase: 'opening' });
    expect(nextNoteLayer(null, null)).toBeNull();
  });

  test('open slides in, close slides out and then removes the note', () => {
    jest.useFakeTimers();
    const h = renderHook(({ t }) => useNoteLayer(t), { initialProps: { t: null as string | null } });
    expect(h.result.current).toBeNull();
    h.rerender({ t: 'n1' });
    expect(h.result.current).toEqual({ noteId: 'n1', phase: 'opening' });
    act(() => jest.advanceTimersByTime(NOTE_SLIDE_MS));
    expect(h.result.current?.phase).toBe('open');
    h.rerender({ t: null });
    expect(h.result.current).toEqual({ noteId: 'n1', phase: 'closing' });
    act(() => jest.advanceTimersByTime(NOTE_SLIDE_MS));
    expect(h.result.current).toBeNull();
    jest.useRealTimers();
  });

  test('a note already in the URL when the page mounts is shown at once', () => {
    const h = renderHook(() => useNoteLayer('n1'));
    expect(h.result.current).toEqual({ noteId: 'n1', phase: 'open' });
  });
});
