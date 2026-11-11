import React from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RootState } from '../../../../core/store';
import { apiFetch } from '../../../../shared/utils/Helpers/apiFetch';
import { notesKeys } from '../../hooks/useNotesQueries';
import { formatApiError, toastNotifications } from '../../../../shared/utils/toast';
import { askConfirm } from '../../../../shared/components/dialog/AppDialog';

type DeletedItem = {
  id: string;
  type: 'FOLDER' | 'NOTE' | 'LOG';
  name?: string;
  parentId: string;
  content?: { data: string; date?: string };
  deletedAt: string;
};

const deletedKey = (notebook: string) => ['notes', 'deleted', notebook] as const;

const labelFor = (item: DeletedItem) => {
  if (item.type === 'FOLDER') return item.name || item.id;
  const first = (item.content?.data ?? '').split('\n')[0].trim();
  return first || '(empty)';
};

const kindFor = (item: DeletedItem) => (item.type === 'FOLDER' ? 'Folder (with everything in it)' : item.type === 'LOG' ? 'Log entry' : 'Note');

/** Recently Deleted for the current notebook: restore an item (and the subtree deleted with it) or empty the list. */
const RecentlyDeleted: React.FC = () => {
  const notebook = useSelector((state: RootState) => state.person.selectedNoteName) ?? '';
  const qc = useQueryClient();
  const history = useHistory();

  const { data, isLoading } = useQuery<DeletedItem[]>({
    queryKey: deletedKey(notebook),
    enabled: !!notebook,
    queryFn: async () => {
      const res = await apiFetch(`/api/note-v2/deleted?notebook=${encodeURIComponent(notebook)}`);
      if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
      return res.json();
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: deletedKey(notebook) });
    qc.invalidateQueries({ queryKey: notesKeys.all });
  };

  const restore = useMutation({
    mutationFn: async (item: DeletedItem) => {
      const res = await apiFetch('/api/note-v2', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, deletedAt: null }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    },
    onSuccess: refresh,
    onError: (e) => toastNotifications.error(`Failed to restore: ${formatApiError(e)}`),
  });

  const empty = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(`/api/note-v2/deleted?notebook=${encodeURIComponent(notebook)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    },
    onSuccess: refresh,
    onError: (e) => toastNotifications.error(`Failed to empty: ${formatApiError(e)}`),
  });

  const onEmpty = async () => {
    const ok = await askConfirm({
      title: 'Empty Recently Deleted?',
      message: 'Everything in Recently Deleted is deleted permanently. This cannot be undone.',
      confirmLabel: 'Delete all',
      danger: true,
    });
    if (ok) empty.mutate();
  };

  return (
    <div className="deleted-page">
      <h1>Recently Deleted</h1>
      <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>{notebook}</div>
      {isLoading && <p>Loading...</p>}
      {!isLoading && (!data || data.length === 0) && <p style={{ textAlign: 'center' }}>Nothing deleted.</p>}
      {data?.map((item) => (
        <div className="deleted-row" key={item.id} data-testid="deleted-row">
          <div className="deleted-name">
            {labelFor(item)}
            <small>
              {kindFor(item)} · deleted {new Date(item.deletedAt).toLocaleString()}
            </small>
          </div>
          <button type="button" onClick={() => restore.mutate(item)}>
            Restore
          </button>
        </div>
      ))}
      {data && data.length > 0 && (
        <button type="button" className="deleted-empty-btn" onClick={onEmpty}>
          Empty Recently Deleted
        </button>
      )}
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <button type="button" onClick={() => history.push('/notes/main')} style={{ background: 'transparent', color: 'var(--accent-text)', border: 0 }}>
          Done
        </button>
      </div>
    </div>
  );
};

export default RecentlyDeleted;
