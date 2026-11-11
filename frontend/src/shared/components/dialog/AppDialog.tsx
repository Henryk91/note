import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { IconBook } from '@tabler/icons-react';
import './appDialog.css';

/**
 * In-app replacement for window.prompt / window.confirm: one dialog at a time, opened with `askText` or
 * `askConfirm` (both return a promise), drawn by <AppDialogHost /> in the theme's colours.
 */
type TextRequest = {
  kind: 'text';
  title: string;
  label?: string;
  placeholder?: string;
  initial?: string;
  confirmLabel?: string;
  /** Existing values shown as one-tap choices above the field (e.g. notebooks). */
  choices?: string[];
  choicesLabel?: string;
  resolve: (value: string | null) => void;
};
type ConfirmRequest = {
  kind: 'confirm';
  title: string;
  message?: string;
  confirmLabel?: string;
  danger?: boolean;
  resolve: (ok: boolean) => void;
};
type Request = TextRequest | ConfirmRequest;

let current: Request | null = null;
let hostMounted = false;
const listeners = new Set<() => void>();
const set = (r: Request | null) => {
  current = r;
  listeners.forEach((l) => l());
};
/** A new question replaces an open one, which counts as cancelled. */
const cancelCurrent = () => {
  if (!current) return;
  if (current.kind === 'text') current.resolve(null);
  else current.resolve(false);
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Ask for a line of text. Resolves with the trimmed value, or null when cancelled or empty. */
export const askText = (opts: Omit<TextRequest, 'kind' | 'resolve'>): Promise<string | null> => {
  if (!hostMounted) {
    // eslint-disable-next-line no-alert
    const v = window.prompt(opts.title, opts.initial ?? '');
    return Promise.resolve(v && v.trim() ? v.trim() : null);
  }
  cancelCurrent();
  return new Promise((resolve) => set({ ...opts, kind: 'text', resolve }));
};

/** Ask a yes / no question. Resolves true only when the confirm button is pressed. */
export const askConfirm = (opts: Omit<ConfirmRequest, 'kind' | 'resolve'>): Promise<boolean> => {
  if (!hostMounted) {
    // eslint-disable-next-line no-alert
    return Promise.resolve(window.confirm(opts.message ? `${opts.title}\n\n${opts.message}` : opts.title));
  }
  cancelCurrent();
  return new Promise((resolve) => set({ ...opts, kind: 'confirm', resolve }));
};

const TextBody: React.FC<{ req: TextRequest; close: () => void }> = ({ req, close }) => {
  const [value, setValue] = useState(req.initial ?? '');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const el = inputRef.current;
    el?.focus();
    el?.select();
  }, []);
  const done = (v: string | null) => {
    req.resolve(v && v.trim() ? v.trim() : null);
    close();
  };
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) done(value);
      }}
    >
      <h2 className="dlg-title" id="dlg-title">
        {req.title}
      </h2>
      {req.choices && req.choices.length > 0 && (
        <>
          <div className="dlg-cap">{req.choicesLabel ?? 'Choose'}</div>
          <div className="dlg-choices">
            {req.choices.map((c) => (
              <button type="button" key={c} className="dlg-choice" onClick={() => done(c)}>
                <IconBook size={16} aria-hidden />
                <span>{c}</span>
              </button>
            ))}
          </div>
        </>
      )}
      <label className="dlg-fld">
        {req.label ?? 'Name'}
        <input
          ref={inputRef}
          className="dlg-in"
          value={value}
          placeholder={req.placeholder}
          onChange={(e) => setValue(e.target.value)}
          autoComplete="off"
          enterKeyHint="done"
        />
      </label>
      <div className="dlg-actions">
        <button type="button" className="dlg-btn" onClick={() => done(null)}>
          Cancel
        </button>
        <button type="submit" className="dlg-btn is-primary" disabled={!value.trim()}>
          {req.confirmLabel ?? 'OK'}
        </button>
      </div>
    </form>
  );
};

const ConfirmBody: React.FC<{ req: ConfirmRequest; close: () => void }> = ({ req, close }) => {
  const okRef = useRef<HTMLButtonElement>(null);
  useEffect(() => okRef.current?.focus(), []);
  const done = (ok: boolean) => {
    req.resolve(ok);
    close();
  };
  return (
    <>
      <h2 className="dlg-title" id="dlg-title">
        {req.title}
      </h2>
      {req.message && <p className="dlg-msg">{req.message}</p>}
      <div className="dlg-actions">
        <button type="button" className="dlg-btn" onClick={() => done(false)}>
          Cancel
        </button>
        <button ref={okRef} type="button" className={`dlg-btn is-primary ${req.danger ? 'is-danger' : ''}`} onClick={() => done(true)}>
          {req.confirmLabel ?? 'OK'}
        </button>
      </div>
    </>
  );
};

/** Mount once (MainLayout). Esc or a click outside the card cancels. */
export const AppDialogHost: React.FC = () => {
  const req = useSyncExternalStore(subscribe, () => current);
  useEffect(() => {
    hostMounted = true;
    return () => {
      hostMounted = false;
    };
  }, []);
  useEffect(() => {
    if (!req) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      cancelCurrent();
      set(null);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [req]);
  if (!req) return null;
  const close = () => set(null);
  const cancel = () => {
    cancelCurrent();
    close();
  };
  return createPortal(
    <div className="dlg-backdrop" onMouseDown={(e) => e.target === e.currentTarget && cancel()}>
      <div className="dlg-card" role="dialog" aria-modal="true" aria-labelledby="dlg-title">
        {req.kind === 'text' ? <TextBody key={req.title} req={req} close={close} /> : <ConfirmBody key={req.title} req={req} close={close} />}
      </div>
    </div>,
    document.body,
  );
};
