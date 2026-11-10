import React, { PropsWithChildren } from 'react';
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useItemMutations, useSaveStatus, resetSaveStatusForTests } from '../src/features/notes/edit/itemMutations';
import { notesKeys } from '../src/features/notes/hooks/useNotesQueries';
import * as queue from '../src/offlineQueue/queue';
import { ItemType } from '../src/shared/utils/Helpers/types';

jest.mock('../src/offlineQueue/queue', () => ({
  sendOrQueueJSON: jest.fn(),
  getAllRequests: jest.fn().mockResolvedValue([]),
}));

const send = queue.sendOrQueueJSON as jest.Mock;
const note = { id: 'f::NOTE::1', parentId: 'f', type: ItemType.NOTE, content: { data: 'old' } };

const setup = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(notesKeys.withChildren('f'), { notes: { f: { id: 'f', heading: 'F', dataLable: [note] } } });
  const wrapper = ({ children }: PropsWithChildren<{}>) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  const hook = renderHook(() => ({ m: useItemMutations('f'), status: useSaveStatus() }), { wrapper });
  const items = () => (qc.getQueryData(notesKeys.withChildren('f')) as any).notes.f.dataLable;
  return { qc, hook, items };
};

beforeEach(() => {
  send.mockReset();
  resetSaveStatusForTests();
});

describe('autosave through the offline queue', () => {
  test('an edit updates the cache at once and PUTs the same id (never delete + create)', async () => {
    send.mockResolvedValue({ queued: false, response: {} });
    const { hook, items } = setup();
    await act(async () => {
      await hook.result.current.m.updateText(note as any, 'new text');
    });
    expect(items()[0].content.data).toBe('new text');
    expect(send).toHaveBeenCalledWith('/api/note-v2', { id: 'f::NOTE::1', content: { data: 'new text' } }, { method: 'PUT' });
    expect(hook.result.current.status).toBe('saved');
  });

  test('offline: the change is queued, stays visible and the indicator says it will sync', async () => {
    send.mockResolvedValue({ queued: true });
    const { hook, items } = setup();
    await act(async () => {
      await hook.result.current.m.updateText(note as any, 'offline edit');
    });
    expect(items()[0].content.data).toBe('offline edit');
    expect(hook.result.current.status).toBe('offline');
  });

  test('an HTTP error rolls the edit back (and is not queued)', async () => {
    send.mockRejectedValue(new Error('HTTP 400'));
    const { hook, items } = setup();
    await act(async () => {
      await hook.result.current.m.updateText(note as any, 'will fail');
    });
    expect(items()[0].content.data).toBe('old');
  });

  test('delete removes from the cache, restore puts it back with a PUT deletedAt: null', async () => {
    send.mockResolvedValue({ queued: false, response: {} });
    const { hook, items } = setup();
    await act(async () => {
      await hook.result.current.m.remove(note as any);
    });
    expect(items()).toHaveLength(0);
    expect(send).toHaveBeenLastCalledWith('/api/note-v2', { id: 'f::NOTE::1', type: 'NOTE' }, { method: 'DELETE' });
    await act(async () => {
      await hook.result.current.m.restore(note as any);
    });
    expect(items()).toHaveLength(1);
    expect(send).toHaveBeenLastCalledWith('/api/note-v2', { id: 'f::NOTE::1', deletedAt: null }, { method: 'PUT' });
  });

  test('creating a block appends it optimistically and POSTs it', async () => {
    send.mockResolvedValue({ queued: false, response: { id: 'f::NOTE::2', createdAt: 'x' } });
    const { hook, items } = setup();
    await act(async () => {
      await hook.result.current.m.create(ItemType.NOTE, 'fresh', 'f::NOTE::2');
    });
    expect(items().map((i: any) => i.id)).toEqual(['f::NOTE::1', 'f::NOTE::2']);
    expect(send.mock.calls[0][0]).toBe('/api/note-v2');
    expect(send.mock.calls[0][2]).toEqual({ method: 'POST' });
  });
});
