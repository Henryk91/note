import { IconCopy, IconChevronLeft, IconChevronRight, IconDots, IconPlayerPlay } from '@tabler/icons-react';
import { useHistory, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../core/store';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useLogData } from './useLogData';
import { prefillKey } from './QuickLogSheet';
import { useLogMutations, usePendingEntries } from './logApi';
import { Calendar } from './Calendar';
import { Composer, isTouch } from './Composer';
import { LogRow } from './LogRow';
import { DailyValueSummary } from './Summaries';
import { SummaryScreen, summaryCopyText } from './SummaryScreen';
import { TallyView } from './TallyView';
import { DesktopDayBar, DesktopEntryBar, DesktopLogHeader, DesktopLogTable, PICK_LOG_DAY_EVENT, setSelectedLogDay } from './DesktopLog';
import { useDismiss } from '../edit/useDismiss';
import { isFrontPage, useFrontIndex, useHeader } from '../../../shared/header/headerStore';
import { useBreakpoint } from '../layout/useBreakpoint';
import { ItemMenuEntry } from '../edit/ItemMenu';
import {
  adjacentDay,
  dailyValueInfo,
  DEFAULT_BREAK_WORDS,
  DEFAULT_CHIPS,
  dayKeyOf,
  firstLine,
  formatDayLong,
  formatDayComma,
  formatDuration,
  isLongEntry,
  lastTask,
  LogEntry,
  LogMode,
  recentTickets,
  summarizeDay,
  tallyCodes,
  tallyStats,
  weekTotals,
} from './logModel';
import { chipLabel, defaultTsForDay, PanelValue, panelFromTs, parsePanel, stepTs } from './entryTime';
import { askConfirm, askText } from '../../../shared/components/dialog/AppDialog';
import { ScrollJump } from '../../../shared/components/ScrollJump';
import { suggestEntries } from './suggest';
import { useItemMutations } from '../edit/itemMutations';
import { useDeleteWithUndo } from '../edit/useDeleteWithUndo';
import { buildFolderChain, pathForFolder } from '../hooks/useFolderUrlSync';
import { MoveToSheet } from '../layout/MoveToSheet';
import { apiFetch } from '../../../shared/utils/Helpers/apiFetch';

const MODE_LABELS: Record<LogMode, string> = {
  'time-tracker': 'Time tracker',
  tally: 'Tally',
  'daily-value': 'Daily value',
  journal: 'Journal',
};

const draftKey = (logId: string) => `log-edit-draft:${logId}`;

type StoredDraft = { id: string; text: string; ts: number };

const readDraft = (logId: string): StoredDraft | null => {
  try {
    const raw = localStorage.getItem(draftKey(logId));
    return raw ? (JSON.parse(raw) as StoredDraft) : null;
  } catch {
    return null;
  }
};
const writeDraft = (logId: string, draft: StoredDraft | null) => {
  try {
    if (draft) localStorage.setItem(draftKey(logId), JSON.stringify(draft));
    else localStorage.removeItem(draftKey(logId));
  } catch {
    /* storage unavailable */
  }
};

export const LogScreen: React.FC<{ logId: string }> = ({ logId }) => {
  const { entries, grouped, settings, mode, label, notebook, parentName, parentId, loaded, saveSettings, refetch, logItem } = useLogData(logId);
  const parentMutations = useItemMutations(parentId);
  const deleteWithUndo = useDeleteWithUndo(parentMutations);
  const bp = useBreakpoint();
  const phone = bp === 'mobile';
  const history = useHistory();
  const location = useLocation();
  const view: 'log' | 'summary' = new URLSearchParams(location.search).get('view') === 'summary' ? 'summary' : 'log';
  const openSummary = () => history.push(`${location.pathname}?view=summary`);
  const closeSummary = () => history.replace(location.pathname);
  const pagesState = useSelector((st: RootState) => st.person.pages);
  const front = useFrontIndex(pagesState.length);
  const byIdState = useSelector((st: RootState) => st.person.byId);
  const mutations = useLogMutations(logId);
  const pendingIds = usePendingEntries();

  const [now, setNow] = useState(() => Date.now());
  const todayKey = dayKeyOf(now);
  const [day, setDay] = useState(todayKey);
  const [text, setText] = useState('');
  const [customTs, setCustomTs] = useState<number | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panel, setPanel] = useState<PanelValue>({ date: '', time: '' });
  const [panelError, setPanelError] = useState<string | null>(null);
  const [editing, setEditing] = useState<LogEntry | null>(null);
  const [aside, setAside] = useState<{ text: string; customTs: number | null } | null>(null);
  const [calOpen, setCalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [otherOpen, setOtherOpen] = useState(false);
  const [draft, setDraft] = useState<StoredDraft | null>(() => readDraft(logId));
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const titleMenuRef = useRef<HTMLDivElement>(null);
  useDismiss(menuOpen, titleMenuRef, () => setMenuOpen(false));
  const timelineRef = useRef<HTMLDivElement>(null);
  const prefilledDay = useRef<string | null>(null);
  const touchStart = useRef<{ x: number; y: number; t: number; selected: boolean } | null>(null);

  // Desktop: the date / time fields are always visible in the entry bar (desktop-log.html), so the "panel" is always open.
  const closePanel = () => setPanelOpen(!phone);
  useEffect(() => {
    if (!phone) {
      setPanelOpen(true);
      setPanel(panelFromTs(customTs ?? Date.now()));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone]);

  const breakWords = settings.breakWords?.length ? settings.breakWords : DEFAULT_BREAK_WORDS;
  const dayEntries = useMemo(() => grouped.byDay[day] ?? [], [grouped, day]);
  const daySet = useMemo(() => new Set(grouped.days), [grouped.days]);

  // A search hit on a log entry opens that entry's day.
  useEffect(() => {
    try {
      const goto = sessionStorage.getItem(`log-goto:${logId}`);
      if (goto) {
        sessionStorage.removeItem(`log-goto:${logId}`);
        const ts = Date.parse(goto);
        if (!Number.isNaN(ts)) setDay(dayKeyOf(ts));
      }
    } catch {
      /* storage unavailable */
    }
  }, [logId]);

  // Text handed over by the quick-log sheet (a chip tapped there): fill the box and focus it.
  useEffect(() => {
    try {
      const value = sessionStorage.getItem(prefillKey(logId));
      if (value) {
        sessionStorage.removeItem(prefillKey(logId));
        setText(value);
        setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50);
      }
    } catch {
      /* storage unavailable */
    }
  }, [logId]);

  // ---- clock ---------------------------------------------------------------------------------------
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const id = setInterval(tick, 15000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        tick();
        if (pendingIds.size === 0) refetch();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', tick);
    };
  }, [refetch, pendingIds]);

  // ---- the time chip -------------------------------------------------------------------------------
  const chipTs = customTs ?? (day === todayKey ? now : defaultTsForDay(day, now));
  const chipText = chipLabel(chipTs, formatDayComma(dayKeyOf(chipTs)));

  // While the panel is open and untouched it keeps following the clock.
  useEffect(() => {
    if (panelOpen && customTs === null) setPanel(panelFromTs(chipTs));
  }, [panelOpen, customTs, chipTs]);

  const followDay = useCallback(
    (ts: number) => {
      const key = dayKeyOf(ts);
      if (daySet.has(key)) setDay(key);
    },
    [daySet],
  );

  const onPanelField = (field: keyof PanelValue, value: string) => {
    const next = { ...panel, [field]: value };
    setPanel(next);
    const parsed = parsePanel(next);
    if (parsed.ok) {
      setPanelError(null);
      setCustomTs(parsed.ts);
      if (!editing) followDay(parsed.ts);
    } else {
      setPanelError(parsed.error);
    }
  };

  const onStep = (unit: 'd' | 'h' | 'min', direction: 1 | -1) => {
    const parsed = parsePanel(panel);
    const base = parsed.ok ? parsed.ts : chipTs;
    const next = stepTs(base, unit, direction);
    setCustomTs(next);
    setPanel(panelFromTs(next));
    setPanelError(null);
    if (!editing) followDay(next);
  };

  const togglePanel = () => {
    if (panelOpen) {
      setPanelOpen(false);
      return;
    }
    setPanel(panelFromTs(chipTs));
    setPanelError(null);
    setPanelOpen(true);
  };

  // ---- editing -------------------------------------------------------------------------------------
  useEffect(() => {
    if (editing) writeDraft(logId, { id: editing.id, text, ts: customTs ?? editing.ts });
  }, [editing, text, customTs, logId]);

  const beginEdit = useCallback(
    (entry: LogEntry, override?: { text: string; ts: number }) => {
      if (!editing) setAside({ text, customTs });
      const ts = override?.ts ?? entry.ts;
      setEditing(entry);
      setText(override?.text ?? entry.text);
      setCustomTs(ts);
      setPanel(panelFromTs(ts));
      setPanelError(null);
      setPanelOpen(true);
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0);
    },
    [editing, text, customTs],
  );

  const finishEdit = useCallback(() => {
    writeDraft(logId, null);
    setEditing(null);
    closePanel();
    setPanelError(null);
    setText(aside?.text ?? '');
    setCustomTs(aside?.customTs ?? null);
    setAside(null);
  }, [aside, logId]);

  const resetOrCancel = () => {
    if (editing) {
      finishEdit();
      return;
    }
    setCustomTs(null);
    setPanel(panelFromTs(day === todayKey ? now : defaultTsForDay(day, now)));
    setPanelError(null);
  };

  // ---- sending -------------------------------------------------------------------------------------
  const scrollToEnd = () => {
    requestAnimationFrame(() => {
      const el = timelineRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  };

  const resolveTs = (): number | null => {
    if (panelOpen) {
      const parsed = parsePanel(panel);
      if (!parsed.ok) {
        setPanelError(parsed.error);
        return null;
      }
      return parsed.ts;
    }
    return chipTs;
  };

  const send = () => {
    const value = text.trim();
    if (!value) {
      inputRef.current?.focus({ preventScroll: true });
      return;
    }
    const ts = resolveTs();
    if (ts === null) return;
    // Phones: close the keyboard once the entry is sent (desktop keeps the focus for the next entry).
    if (isTouch()) inputRef.current?.blur();
    if (editing) {
      void mutations.update(editing, value, ts);
      setDay(dayKeyOf(ts));
      finishEdit();
    } else {
      void mutations.create(value, ts);
      setDay(dayKeyOf(ts));
      setText('');
      setCustomTs(null);
      closePanel();
      scrollToEnd();
    }
  };

  const logCode = (code: string) => {
    const ts = resolveTs();
    if (ts === null) return;
    void mutations.create(code, ts);
    setDay(dayKeyOf(ts));
    setCustomTs(null);
    closePanel();
    scrollToEnd();
  };

  const fill = (value: string) => {
    setText(value);
    setTimeout(() => {
      const el = inputRef.current;
      if (el) {
        el.focus({ preventScroll: true });
        el.setSelectionRange(value.length, value.length);
      }
    }, 0);
  };

  // ---- row actions ---------------------------------------------------------------------------------
  const onCopy = async (entry: LogEntry) => {
    try {
      await navigator.clipboard.writeText(entry.text);
      toast.success('Copied');
    } catch {
      toast.error('Could not copy');
    }
  };

  // Every way of deleting an entry (row menu, Delete key, the Delete button while editing) asks first.
  const confirmDelete = async (entry: LogEntry) => {
    const ok = await askConfirm({
      title: 'Delete this entry?',
      message: firstLine(entry.text) || undefined,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (ok) onDelete(entry);
  };

  const onDelete = (entry: LogEntry) => {
    if (editing?.id === entry.id) finishEdit();
    void mutations.remove(entry);
    toast(
      (t) => (
        <span>
          Entry deleted
          <button
            type="button"
            className="log-toast-undo"
            onClick={() => {
              void mutations.restore(entry);
              toast.dismiss(t.id);
            }}
          >
            Undo
          </button>
        </span>
      ),
      { duration: 8000 },
    );
  };

  // ---- days ----------------------------------------------------------------------------------------
  const goDay = useCallback(
    (target: string | null) => {
      if (!target) return;
      setDay(target);
      if (!editing) setCustomTs(null);
      setCalOpen(false);
    },
    [editing],
  );
  // Desktop: the days column shows which day is open and opens a day (or the calendar) through an event.
  useEffect(() => {
    if (phone) return undefined;
    setSelectedLogDay({ logId, day });
    return () => setSelectedLogDay(null);
  }, [phone, logId, day]);
  useEffect(() => {
    const onPick = (e: Event) => {
      const d = (e as CustomEvent).detail as { logId: string; day?: string; calendar?: boolean };
      if (d?.logId !== logId) return;
      if (d.calendar) setCalOpen((v) => !v);
      else if (d.day) goDay(d.day);
    };
    window.addEventListener(PICK_LOG_DAY_EVENT, onPick);
    return () => window.removeEventListener(PICK_LOG_DAY_EVENT, onPick);
  }, [logId, goDay]);
  const prevDay = adjacentDay(grouped.days, day, 'prev');
  const nextDay = adjacentDay(grouped.days, day, 'next');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const typing = el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA';
      if (e.key === 'Escape' && editing) {
        e.preventDefault();
        finishEdit();
      } else if ((e.altKey && e.key === 'ArrowLeft') || (!typing && e.key === '[')) {
        e.preventDefault();
        goDay(prevDay);
      } else if ((e.altKey && e.key === 'ArrowRight') || (!typing && e.key === ']')) {
        e.preventDefault();
        goDay(nextDay);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editing, finishEdit, goDay, prevDay, nextDay]);

  // the newest entry stays in view when the time panel opens or closes
  useEffect(() => {
    if (!editing) scrollToEnd();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelOpen]);

  // stay at the newest entry when the day or the number of entries changes
  useEffect(() => {
    if (!editing) scrollToEnd();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, dayEntries.length]);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY, t: Date.now(), selected: !!window.getSelection()?.toString() };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const s = touchStart.current;
    touchStart.current = null;
    if (!s || s.selected || window.getSelection()?.toString()) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    if (Math.abs(dx) > 90 && Math.abs(dy) < 40 && Date.now() - s.t < 400) goDay(dx < 0 ? nextDay : prevDay);
  };

  // ---- mode data -----------------------------------------------------------------------------------
  const summary = useMemo(() => summarizeDay(dayEntries, now, breakWords), [dayEntries, now, breakWords]);
  const week = useMemo(() => weekTotals(grouped.byDay, day, now, breakWords), [grouped.byDay, day, now, breakWords]);
  const task = useMemo(() => lastTask(dayEntries, breakWords), [dayEntries, breakWords]);
  const codes = useMemo(() => (mode === 'tally' ? tallyCodes(entries) : []), [mode, entries]);
  const tally = useMemo(() => (mode === 'tally' ? tallyStats(entries, day, now) : null), [mode, entries, day, now]);
  const daily = useMemo(() => (mode === 'daily-value' ? dailyValueInfo(entries, todayKey) : null), [mode, entries, todayKey]);

  const chips = useMemo(() => {
    if (mode !== 'time-tracker') return [];
    if (settings.chips?.length) return settings.chips;
    return [...DEFAULT_CHIPS, ...recentTickets(entries, 4, breakWords)];
  }, [mode, settings.chips, entries, breakWords]);

  // Suggestions while typing a new entry: earlier entries of this log (not while editing, not for tally codes).
  const suggestions = useMemo(
    () => (editing || mode === 'tally' ? [] : suggestEntries(entries, text, 5, now)),
    [mode, editing, text, entries, now],
  );

  // Daily value: the box starts with yesterday's value so an unchanged value is one tap.
  useEffect(() => {
    if (daily && loaded && !editing && text === '' && !daily.loggedToday && prefilledDay.current !== todayKey) {
      prefilledDay.current = todayKey;
      if (daily.previousValue) setText(daily.previousValue);
    }
  }, [daily, loaded, editing, text, todayKey]);

  const changeMode = (next: LogMode | undefined) => {
    void saveSettings({ mode: next });
    setMenuOpen(false);
  };
  // Move this log to another folder (same picker as folders). A folder has at most one log, so a folder that already
  // has one is refused with a message instead of ending up with two.
  const [movingLog, setMovingLog] = useState(false);
  const moveLogTo = async (target: string) => {
    if (!logItem || target === parentId) return;
    let targetItems: Array<{ id: string; type?: string; name?: string }> | undefined = byIdState[target]?.dataLable as any;
    if (!targetItems) {
      try {
        const res = await apiFetch(`/api/note-v2/with-children?parentId=${encodeURIComponent(target)}`);
        const j = res.ok ? await res.json() : {};
        targetItems = (Object.values(j)[0] as any)?.dataLable ?? [];
      } catch {
        targetItems = [];
      }
    }
    if ((targetItems ?? []).some((i) => i.type === 'FOLDER' && i.name === 'Log' && i.id !== logItem.id)) {
      toast.error('That folder already has a log. A folder can only have one.');
      return;
    }
    await parentMutations.move(logItem, target);
    if (phone) window.dispatchEvent(new Event('page-back'));
    else history.push(pathForFolder(parentId));
  };
  const moveSheet =
    movingLog && logItem ? (
      <MoveToSheet
        item={{ ...logItem, name: 'Log' }}
        notebook={pagesState[0]?.params.id ?? notebook}
        initiallyOpen={[...pagesState.map((pg) => pg.params.id), ...buildFolderChain(parentId || logId)]}
        onPick={(t) => void moveLogTo(t)}
        onClose={() => setMovingLog(false)}
      />
    ) : null;

  // Delete this whole log, after asking (soft delete with Undo; also in Recently Deleted), then back to its folder.
  const deleteLog = async () => {
    setMenuOpen(false);
    if (!logItem) return;
    const ok = await askConfirm({
      title: 'Delete this log?',
      message: `${entries.length === 1 ? 'Its 1 entry is' : `All ${entries.length} entries in it are`} deleted with it. You can undo this or restore it from Recently Deleted.`,
      confirmLabel: 'Delete log',
      danger: true,
    });
    if (!ok) return;
    deleteWithUndo(logItem, 'Log deleted');
    if (phone) window.dispatchEvent(new Event('page-back'));
    else history.push(pathForFolder(parentId));
  };

  const togglePinned = () => {
    void saveSettings({ pinned: !settings.pinned });
    setMenuOpen(false);
  };
  const editBreakWords = async () => {
    setMenuOpen(false);
    const value = await askText({
      title: 'Break words',
      label: 'Entries starting with these words count as breaks (comma separated)',
      initial: breakWords.join(', '),
      placeholder: 'Break, Lunch',
      confirmLabel: 'Save',
    });
    if (value === null) return;
    const words = value.split(',').map((w) => w.trim()).filter(Boolean);
    void saveSettings({ breakWords: words });
  };

  // ---- header (phone): back label, two-line title and this log's `...` menu ----------------------------
  const nameAt = (i: number): string =>
    i <= 0 ? notebook : (byIdState[pagesState[i - 1]?.params.id]?.dataLable?.find((d) => d.id === pagesState[i]?.params.id)?.name ?? '');
  const lastIdx = pagesState.length - 1;
  const grandName = lastIdx >= 2 ? nameAt(lastIdx - 2) : notebook;
  const logMenu: ItemMenuEntry[] = [
    ...(Object.keys(MODE_LABELS) as LogMode[]).map((m) => ({
      label: `${settings.mode === m ? '● ' : '○ '}${MODE_LABELS[m]}`,
      onSelect: () => changeMode(m),
    })),
    { label: 'Automatic mode', onSelect: () => changeMode(undefined) },
    { label: settings.pinned ? 'Unpin from quick log' : 'Pin to quick log', onSelect: togglePinned },
    { label: 'Break words...', onSelect: editBreakWords },
    ...(logItem ? [{ label: 'Move to...', onSelect: () => setMovingLog(true) }] : []),
    ...(logItem ? [{ label: 'Delete log...', onSelect: () => void deleteLog(), danger: true }] : []),
  ];
  const isTally = mode === 'tally';
  useHeader(
    view === 'summary'
      ? {
          kicker: ' ',
          title: 'Summary',
          back: { label: 'Log', onClick: () => closeSummary() },
          action: {
            icon: <IconCopy size="1em" />,
            ariaLabel: 'Copy summary',
            onClick: () => void navigator.clipboard?.writeText(summaryCopyText(day, grouped.byDay, now, breakWords)),
          },
        }
      : {
          kicker: notebook,
          title: isTally ? parentName : 'Log',
          back: { label: (isTally ? grandName : parentName) || 'Back', onClick: () => window.dispatchEvent(new Event('page-back')) },
          menu: logMenu,
        },
    phone && isFrontPage(pagesState, logId, front),
  );

  const isToday = day === todayKey;
  const draftEntry = draft ? entries.find((e) => e.id === draft.id) : undefined;
  const showDraftBanner = !!draft && !editing && loaded;
  const inputVisible = mode !== 'tally' || otherOpen || !!editing;
  const placeholder = mode === 'time-tracker' ? 'What are you working on?' : mode === 'tally' ? 'Other code or note' : 'New entry';

  const sub = (() => {
    if (mode === 'time-tracker') return `${isToday ? 'Today · ' : ''}Worked ${formatDuration(summary.workedMs)}`;
    return `${isToday ? 'Today · ' : ''}${dayEntries.length} ${dayEntries.length === 1 ? 'entry' : 'entries'}`;
  })();

  // ---- desktop (docs/mockups/desktop-log.html): page header, day bar, table, entry bar always visible --------
  if (!phone) {
    const optionsMenu = (
      <div style={{ position: 'relative' }} ref={titleMenuRef}>
        <button type="button" className="dl-ibtn" aria-label="Log options" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)}>
          <IconDots size={16} />
        </button>
        {menuOpen && (
          <div className="log-menu" role="menu" style={{ top: 40, right: 0 }}>
            <div style={{ padding: '4px 10px', fontSize: 11, color: 'var(--muted)' }}>Mode: {MODE_LABELS[mode]}</div>
            {(Object.keys(MODE_LABELS) as LogMode[]).map((m) => (
              <button key={m} type="button" role="menuitemradio" aria-checked={settings.mode === m} onClick={() => changeMode(m)}>
                {settings.mode === m ? '● ' : '○ '}
                {MODE_LABELS[m]}
              </button>
            ))}
            <button type="button" role="menuitem" onClick={() => changeMode(undefined)}>
              Automatic
            </button>
            <button type="button" role="menuitem" onClick={togglePinned}>
              {settings.pinned ? 'Unpin from quick log' : 'Pin to quick log'}
            </button>
            <button type="button" role="menuitem" onClick={editBreakWords}>
              Break words...
            </button>
            {logItem && (
              <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); setMovingLog(true); }}>
                Move to...
              </button>
            )}
            {logItem && (
              <button type="button" role="menuitem" className="danger" onClick={() => void deleteLog()}>
                Delete log...
              </button>
            )}
          </div>
        )}
      </div>
    );
    const kicker = label;
    if (view === 'summary') {
      return (
        <div className="log-screen is-desktop">
          {moveSheet}
          <DesktopLogHeader kicker={kicker} title="Summary" menu={
            <>
              <button type="button" className="dl-btn2" onClick={() => closeSummary()}>
                <IconChevronLeft size={16} /> Log
              </button>
              <button type="button" className="dl-btn2" onClick={() => void navigator.clipboard?.writeText(summaryCopyText(day, grouped.byDay, now, breakWords))}>
                <IconCopy size={16} /> Copy
              </button>
            </>
          } />
          <div className="dl-list">
            <SummaryScreen day={day} byDay={grouped.byDay} nowTs={now} breakWords={breakWords} />
          </div>
        </div>
      );
    }
    return (
      <div className="log-screen is-desktop">
        {moveSheet}
        <DesktopLogHeader
          kicker={kicker}
          title={isTally ? parentName : 'Log'}
          onSummary={mode === 'time-tracker' ? openSummary : undefined}
          menu={optionsMenu}
        />
        {!isTally && (
          <DesktopDayBar
            day={day}
            sub={sub}
            onPrev={prevDay ? () => goDay(prevDay) : null}
            onNext={nextDay ? () => goDay(nextDay) : null}
            onPickDay={() => setCalOpen((v) => !v)}
            todayButton={!isToday && !nextDay ? () => goDay(todayKey) : null}
            continueText={mode === 'time-tracker' && task ? firstLine(task.text) : null}
            onContinue={() => task && fill(firstLine(task.text))}
          />
        )}
        {calOpen && <Calendar selected={day} daysWithEntries={daySet} onPick={(d) => goDay(d)} onClose={() => setCalOpen(false)} />}
        {editing && editing.day !== day && (
          <div className="log-banner" role="status">
            <span>Editing an entry from {formatDayLong(editing.day)}</span>
            <button type="button" onClick={() => goDay(editing.day)}>
              Go to it
            </button>
          </div>
        )}
        {daily && <DailyValueSummary info={daily} />}
        {showDraftBanner && (
          <div className="log-banner" role="status">
            <span>You have an unsaved edit{draftEntry ? '' : ' (the entry no longer exists)'}.</span>
            <span>
              {draftEntry && (
                <button
                  type="button"
                  onClick={() => {
                    setDay(draftEntry.day);
                    beginEdit(draftEntry, { text: draft!.text, ts: draft!.ts });
                    setDraft(null);
                  }}
                >
                  Continue editing
                </button>
              )}{' '}
              <button
                type="button"
                onClick={() => {
                  writeDraft(logId, null);
                  setDraft(null);
                }}
              >
                Discard
              </button>
            </span>
          </div>
        )}
        {isTally ? (
          <div className="dl-list">
            <TallyView entries={entries} codes={codes} nowTs={now} editingId={editing?.id} onCode={logCode} onEdit={beginEdit} />
          </div>
        ) : (
          <DesktopLogTable
            dayEntries={dayEntries}
            nowTs={now}
            breakWords={breakWords}
            expandByDefault={mode === 'journal'}
            editingId={editing?.id}
            pendingIds={pendingIds}
            showContinue={mode === 'time-tracker'}
            empty={!loaded ? 'Loading...' : dayEntries.length === 0 ? (isToday ? 'No entries yet today.' : 'No entries on this day.') : null}
            listRef={timelineRef}
            onEdit={beginEdit}
            onContinue={fill}
            onCopy={onCopy}
            onLogAgain={(e) => {
              setCustomTs(null);
              fill(e.text);
            }}
            onDelete={(e) => void confirmDelete(e)}
          />
        )}
        {(!isTally || editing) && (
          <DesktopEntryBar
            text={text}
            onText={setText}
            placeholder={placeholder}
            panel={customTs === null ? panelFromTs(chipTs) : panel}
            panelError={panelError}
            onPanelField={onPanelField}
            onStep={onStep}
            editing={!!editing}
            onResetOrCancel={resetOrCancel}
        onDeleteEditing={editing ? () => void confirmDelete(editing) : undefined}
            suggestions={suggestions}
        onSuggest={setText}
        onSend={send}
            inputRef={inputRef}
          />
        )}
      </div>
    );
  }

  return (
    <div className="log-screen swiper-no-swiping">
      {moveSheet}
      {!phone && (
      <div className="log-title">
        <div>
          <div className="log-path">{label}</div>
          <h1>Log</h1>
        </div>
        <div style={{ position: 'relative' }} ref={titleMenuRef}>
          <button type="button" className="log-icon-btn" aria-label="Log options" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)}>
            <IconDots size={20} />
          </button>
          {menuOpen && (
            <div className="log-menu" role="menu" style={{ top: 40 }}>
              <div style={{ padding: '4px 10px', fontSize: 11, color: 'var(--muted)' }}>Mode: {MODE_LABELS[mode]}</div>
              {(Object.keys(MODE_LABELS) as LogMode[]).map((m) => (
                <button key={m} type="button" role="menuitemradio" aria-checked={settings.mode === m} onClick={() => changeMode(m)}>
                  {settings.mode === m ? '● ' : '○ '}
                  {MODE_LABELS[m]}
                </button>
              ))}
              <button type="button" role="menuitem" onClick={() => changeMode(undefined)}>
                Automatic
              </button>
              <button type="button" role="menuitem" onClick={togglePinned}>
                {settings.pinned ? 'Unpin from quick log' : 'Pin to quick log'}
              </button>
              <button type="button" role="menuitem" onClick={editBreakWords}>
                Break words...
              </button>
              {logItem && (
                <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); setMovingLog(true); }}>
                  Move to...
                </button>
              )}
              {logItem && (
                <button type="button" role="menuitem" className="danger" onClick={() => void deleteLog()}>
                  Delete log...
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      )}

      {view === 'summary' ? (
        <>
          {!phone && (
            <div className="log-title">
              <button type="button" className="log-today-btn" onClick={() => closeSummary()}>
                &lsaquo; Log
              </button>
              <button type="button" className="log-today-btn" onClick={() => void navigator.clipboard?.writeText(summaryCopyText(day, grouped.byDay, now, breakWords))}>
                Copy
              </button>
            </div>
          )}
          <SummaryScreen day={day} byDay={grouped.byDay} nowTs={now} breakWords={breakWords} />
        </>
      ) : (
      <>
      {isTally ? null : (
      <div className="log-daynav">
        <button type="button" className="log-icon-btn" aria-label="Previous day with entries" disabled={!prevDay} onClick={() => goDay(prevDay)}>
          <IconChevronLeft size={16} />
        </button>
        <div className="log-day-label">
          <button type="button" className="log-day-date-btn" onClick={() => setCalOpen((v) => !v)} aria-label="Pick a day" aria-expanded={calOpen}>
            <div className="log-day-date" data-testid="day-label">
              {formatDayComma(day)}
            </div>
          </button>
          {mode === 'time-tracker' && dayEntries.length > 0 ? (
            <button type="button" className="log-day-sub is-link" onClick={openSummary} aria-label="Open the day summary">
              {sub}
            </button>
          ) : (
            <div className="log-day-sub">{sub}</div>
          )}
        </div>
        {!isToday && (
          <button type="button" className="log-today-btn" onClick={() => goDay(todayKey)}>
            Today
          </button>
        )}
        <button type="button" className="log-icon-btn" aria-label="Next day with entries" disabled={!nextDay} onClick={() => goDay(nextDay)}>
          <IconChevronRight size={16} />
        </button>
      </div>
      )}
      {editing && editing.day !== day && (
        <div className="log-banner" role="status">
          <span>Editing an entry from {formatDayLong(editing.day)}</span>
          <button type="button" onClick={() => goDay(editing.day)}>
            Go to it
          </button>
        </div>
      )}
      {calOpen && <Calendar selected={day} daysWithEntries={daySet} onPick={(d) => goDay(d)} onClose={() => setCalOpen(false)} />}

      {mode === 'time-tracker' && task && (
        <button type="button" className="log-continue-top" onClick={() => fill(firstLine(task.text))}>
          <IconPlayerPlay size={"1em"} />
          <span className="log-ellipsis">Continue: {firstLine(task.text)}</span>
        </button>
      )}
      {daily && <DailyValueSummary info={daily} />}

      {showDraftBanner && (
        <div className="log-banner" role="status">
          <span>You have an unsaved edit{draftEntry ? '' : ' (the entry no longer exists)'}.</span>
          <span>
            {draftEntry && (
              <button
                type="button"
                onClick={() => {
                  setDay(draftEntry.day);
                  beginEdit(draftEntry, { text: draft!.text, ts: draft!.ts });
                  setDraft(null);
                }}
              >
                Continue editing
              </button>
            )}{' '}
            <button
              type="button"
              onClick={() => {
                writeDraft(logId, null);
                setDraft(null);
              }}
            >
              Discard
            </button>
          </span>
        </div>
      )}

      {isTally ? (
        <TallyView entries={entries} codes={codes} nowTs={now} editingId={editing?.id} onCode={logCode} onEdit={beginEdit} />
      ) : (
      <div className="log-timeline" ref={timelineRef} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} data-testid="timeline">
        {!loaded && <div className="log-empty">Loading...</div>}
        {loaded && dayEntries.length === 0 && (
          <div className="log-empty">{isToday ? 'No entries yet today.' : 'No entries on this day.'}</div>
        )}
        {dayEntries.map((entry, i) => (
          <LogRow
            key={entry.id}
            entry={entry}
            index={i}
            dayEntries={dayEntries}
            nowTs={now}
            breakWords={breakWords}
            expandByDefault={mode === 'journal'}
            isEditing={editing?.id === entry.id}
            pending={pendingIds.has(entry.id)}
            showContinue={mode === 'time-tracker' && !editing}
            onEdit={beginEdit}
            onContinue={fill}
            onCopy={onCopy}
            onLogAgain={(e) => {
              setCustomTs(null);
              fill(e.text);
            }}
            onDelete={(e) => void confirmDelete(e)}
          />
        ))}
        <ScrollJump count={dayEntries.length} />
      </div>
      )}

      {(!isTally || editing) && (
      <Composer
        text={text}
        onText={setText}
        placeholder={placeholder}
        chipLabel={chipText}
        panelOpen={panelOpen}
        onTogglePanel={togglePanel}
        panel={customTs === null ? panelFromTs(chipTs) : panel}
        panelError={panelError}
        onPanelField={onPanelField}
        onStep={onStep}
        editing={!!editing}
        onResetOrCancel={resetOrCancel}
        onDeleteEditing={editing ? () => void confirmDelete(editing) : undefined}
        suggestions={suggestions}
        onSuggest={setText}
        onSend={send}
        tallyCodes={undefined}
        onTally={logCode}
        showInput={inputVisible}
        onShowInput={() => setOtherOpen(true)}
        inputRef={inputRef}
      />
      )}
      </>
      )}
    </div>
  );
};

export { isLongEntry };
export default LogScreen;
