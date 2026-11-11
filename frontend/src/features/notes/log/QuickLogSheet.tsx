import React, { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useHistory } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiFetch } from '../../../shared/utils/Helpers/apiFetch';
import { pathForFolder } from '../hooks/useFolderUrlSync';
import { useLogData } from './useLogData';
import { useLogMutations } from './logApi';
import { DEFAULT_CHIPS, recentTickets, tallyCodes } from './logModel';

export const QUICK_LOG_EVENT = 'open-quick-log';
export const prefillKey = (logId: string) => `log-prefill:${logId}`;

export type PinnedLog = { id: string; label: string; notebook?: string; settings?: { mode?: string } };

export const usePinnedLogs = (enabled: boolean) =>
  useQuery<PinnedLog[]>({
    queryKey: ['notes', 'pinned-logs'],
    enabled,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const res = await apiFetch('/api/note-v2/pinned-logs');
      if (!res.ok) throw new Error(`Failed to load pinned logs: ${res.status}`);
      return res.json();
    },
  });

const PinnedCard: React.FC<{ log: PinnedLog; onDone: () => void }> = ({ log, onDone }) => {
  const history = useHistory();
  const { entries, mode } = useLogData(log.id);
  const { create } = useLogMutations(log.id);

  const open = (prefill?: string) => {
    try {
      if (prefill) sessionStorage.setItem(prefillKey(log.id), prefill);
    } catch {
      /* storage unavailable */
    }
    history.push(pathForFolder(log.id));
    onDone();
  };

  const codes = mode === 'tally' ? tallyCodes(entries) : [];
  const chips = mode === 'time-tracker' ? [...DEFAULT_CHIPS, ...recentTickets(entries, 3)] : [];

  return (
    <div className="log-sheet-card" data-testid="pinned-log">
      <div className="log-sheet-title">
        <span>{log.label}</span>
        <button type="button" className="open" onClick={() => open()}>
          Open
        </button>
      </div>
      {codes.length > 0 && (
        <div className="log-tally">
          {codes.map((code) => (
            <button
              type="button"
              key={code}
              onClick={() => {
                void create(code, Date.now());
                toast.success(`Logged ${code}`);
                onDone();
              }}
            >
              {code}
            </button>
          ))}
        </div>
      )}
      {chips.length > 0 && (
        <div className="log-chips" style={{ marginTop: 8 }}>
          {chips.map((c) => (
            <button type="button" key={c} onClick={() => open(c)}>
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/** "Quick log": pinned logs reachable from anywhere (button, or Cmd/Ctrl+L). */
export const QuickLogSheet: React.FC<{ enabled: boolean }> = ({ enabled }) => {
  const [open, setOpen] = useState(false);
  const { data: pinned, isLoading } = usePinnedLogs(enabled && open);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        // Inside a log: new log entry (focus the box). Anywhere else: the quick log sheet.
        const box = document.querySelector<HTMLTextAreaElement>('.log-screen textarea');
        if (box) box.focus();
        else setOpen((v) => !v);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    const onEvent = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener(QUICK_LOG_EVENT, onEvent);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(QUICK_LOG_EVENT, onEvent);
    };
  }, []);

  if (!open) return null;
  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div className="log-sheet-backdrop" onClick={close}>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div className="log-sheet" role="dialog" aria-label="Quick log" onClick={(e) => e.stopPropagation()}>
        <h2>Quick log</h2>
        {isLoading && <div className="log-empty">Loading...</div>}
        {!isLoading && (!pinned || pinned.length === 0) && (
          <div className="log-empty">No pinned logs yet. Open a log, then use its ... menu and choose "Pin to quick log".</div>
        )}
        {pinned?.map((p) => (
          <PinnedCard key={p.id} log={p} onDone={close} />
        ))}
        <div style={{ textAlign: 'right' }}>
          <button type="button" onClick={close} style={{ color: 'var(--muted)', background: 'transparent', border: 0 }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
