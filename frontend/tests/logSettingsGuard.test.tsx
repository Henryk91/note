import { act, renderHook } from '@testing-library/react';
import { frontIndex, isFrontPage, setBackTarget, setHeader, useFrontIndex, useHeader, useHeaderState } from '../src/shared/header/headerStore';
import { mergeSettings } from '../src/features/notes/log/useLogData';

// ui-review N1: Break P5's stored `settings.mode` changed from "tally" to "time-tracker" without anyone picking it.
// Cause: a log screen further back in the phone page stack could re-register the app header, so the header's `...`
// mode menu acted on a log that was not on screen; and settings were written as a whole object built from whatever the
// screen had loaded. These tests pin both guards.

describe('log settings: a log mode only changes when the user picks one for that log', () => {
  test('mergeSettings changes only the patched key and keeps the stored mode', () => {
    expect(mergeSettings({ mode: 'tally', pinned: true }, { pinned: false })).toEqual({ mode: 'tally', pinned: false });
    expect(mergeSettings({ mode: 'tally', pinned: true }, { breakWords: ['Break'] })).toEqual({
      mode: 'tally',
      pinned: true,
      breakWords: ['Break'],
    });
  });

  test('mergeSettings removes a key only when it is explicitly set to undefined ("Automatic mode")', () => {
    expect(mergeSettings({ mode: 'tally', pinned: true }, { mode: undefined })).toEqual({ pinned: true });
    expect(mergeSettings(undefined, { mode: 'journal' })).toEqual({ mode: 'journal' });
  });

  test('only the page in front of the stack may own the header', () => {
    const pages = [{ params: { id: 'Henry' } }, { params: { id: 'P5::Log' } }, { params: { id: 'Track::Log' } }];
    expect(isFrontPage(pages, 'Track::Log')).toBe(true);
    expect(isFrontPage(pages, 'P5::Log')).toBe(false);
    expect(isFrontPage([], 'P5::Log')).toBe(false);
  });

  test('a page behind the front page cannot take over the header menu, even when its menu changes', () => {
    setHeader({});
    const p5Select = jest.fn();
    const trackSelect = jest.fn();
    const state = renderHook(() => useHeaderState());
    renderHook(() => useHeader({ title: 'Log', menu: [{ label: '● Time tracker', onSelect: trackSelect }] }, true));
    const back = renderHook(({ label }) => useHeader({ title: 'Break P5', menu: [{ label, onSelect: p5Select }] }, false), {
      initialProps: { label: '○ Time tracker' },
    });
    back.rerender({ label: '● Tally' }); // its settings arrived later
    expect(state.result.current.title).toBe('Log');
    act(() => state.result.current.menu?.[0].onSelect());
    expect(trackSelect).toHaveBeenCalledTimes(1);
    expect(p5Select).not.toHaveBeenCalled();
  });

  test('a page that unmounts does not clear the header of the page in front', () => {
    setHeader({});
    const state = renderHook(() => useHeaderState());
    const old = renderHook(() => useHeader({ title: 'Break P5' }, true));
    renderHook(() => useHeader({ title: 'Log' }, true));
    old.unmount();
    expect(state.result.current.title).toBe('Log');
  });
});

describe('phone stack: the header follows the page being slid back to', () => {
  test('frontIndex is the back target while sliding back, else the last page', () => {
    expect(frontIndex(3, null)).toBe(2);
    expect(frontIndex(3, 1)).toBe(1);
    expect(frontIndex(3, 0)).toBe(0);
    // A target that is not behind the last page (slide forward, or a stale target after a push) is ignored.
    expect(frontIndex(3, 2)).toBe(2);
    expect(frontIndex(2, 5)).toBe(1);
    expect(isFrontPage([{ params: { id: 'A' } }, { params: { id: 'B' } }], 'A', frontIndex(2, 0))).toBe(true);
  });

  test('the page slid back to takes the header as soon as the slide starts, before the stack is trimmed', () => {
    setHeader({});
    setBackTarget(null);
    const state = renderHook(() => useHeaderState());
    const page = (index: number, title: string) =>
      renderHook(() => {
        const front = useFrontIndex(2);
        useHeader({ title }, index === front);
      });
    page(0, 'Archive');
    page(1, 'Log');
    expect(state.result.current.title).toBe('Log');
    act(() => setBackTarget(0));
    expect(state.result.current.title).toBe('Archive');
    act(() => setBackTarget(null));
    expect(state.result.current.title).toBe('Log');
  });
});
