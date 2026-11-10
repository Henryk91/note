import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faEllipsisH, faPlay } from '@fortawesome/free-solid-svg-icons';
import { useLogData } from './useLogData';
import { prefillKey } from './QuickLogSheet';
import { useLogMutations, usePendingEntries } from './logApi';
import { Calendar } from './Calendar';
import { Composer } from './Composer';
import { LogRow } from './LogRow';
import { DailyValueSummary, TallySummary, WorkSummary } from './Summaries';
import {
  adjacentDay,
  dailyValueInfo,
  DEFAULT_BREAK_WORDS,
  DEFAULT_CHIPS,
  dayKeyOf,
  firstLine,
  formatDayLong,
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
  const { entries, grouped, settings, mode, label, loaded, saveSettings, refetch } = useLogData(logId);
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
  const timelineRef = useRef<HTMLDivElement>(null);
  const prefilledDay = useRef<string | null>(null);
  const touchStart = useRef<{ x: number; y: number; t: number; selected: boolean } | null>(null);

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
  const chipText = chipLabel(chipTs, formatDayLong(dayKeyOf(chipTs)));

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
    setPanelOpen(false);
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
    if (editing) {
      void mutations.update(editing, value, ts);
      setDay(dayKeyOf(ts));
      finishEdit();
    } else {
      void mutations.create(value, ts);
      setDay(dayKeyOf(ts));
      setText('');
      setCustomTs(null);
      setPanelOpen(false);
      scrollToEnd();
    }
  };

  const logCode = (code: string) => {
    const ts = resolveTs();
    if (ts === null) return;
    void mutations.create(code, ts);
    setDay(dayKeyOf(ts));
    setCustomTs(null);
    setPanelOpen(false);
    scrollToEnd();
  };

  const fill = (value: string) => {
    if (editing) return;
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

  const suggestions = useMemo(() => {
    const q = text.trim().toLowerCase();
    if (mode !== 'time-tracker' || editing || q.length < 2 || text.includes('\n')) return [];
    const seen = new Set<string>();
    const out: string[] = [];
    for (let i = entries.length - 1; i >= 0 && out.length < 4; i -= 1) {
      const line = firstLine(entries[i].text);
      const key = line.toLowerCase();
      if (line && key.startsWith(q) && key !== q && !seen.has(key)) {
        seen.add(key);
        out.push(line);
      }
    }
    return out;
  }, [mode, editing, text, entries]);

  // Daily value: the box starts with yesterday's value so an unchanged value is one tap.
  useEffect(() => {
    if (daily && loaded && !editing && text === '' && !daily.loggedToday && prefilledDay.current !== todayKey) {
      prefilledDay.current = todayKey;
      if (daily.previousValue) setText(daily.previousValue);
    }
  }, [daily, loaded, editing, text, todayKey]);

  const changeMode = (next: LogMode | undefined) => {
    const merged = { ...settings, mode: next };
    if (!next) delete merged.mode;
    void saveSettings(merged);
    setMenuOpen(false);
  };
  const togglePinned = () => {
    void saveSettings({ ...settings, pinned: !settings.pinned });
    setMenuOpen(false);
  };
  const editBreakWords = () => {
    // eslint-disable-next-line no-alert
    const value = window.prompt('Break words (comma separated)', breakWords.join(', '));
    setMenuOpen(false);
    if (value === null) return;
    const words = value.split(',').map((w) => w.trim()).filter(Boolean);
    void saveSettings({ ...settings, breakWords: words });
  };

  const isToday = day === todayKey;
  const draftEntry = draft ? entries.find((e) => e.id === draft.id) : undefined;
  const showDraftBanner = !!draft && !editing && loaded;
  const inputVisible = mode !== 'tally' || otherOpen || !!editing;
  const placeholder = mode === 'time-tracker' ? 'What are you working on?' : mode === 'tally' ? 'Other code or note' : 'New entry';

  const sub = (() => {
    if (mode === 'time-tracker') return `${isToday ? 'Today · ' : ''}Worked ${formatDuration(summary.workedMs)}`;
    return `${isToday ? 'Today · ' : ''}${dayEntries.length} ${dayEntries.length === 1 ? 'entry' : 'entries'}`;
  })();

  return (
    <div className="log-screen swiper-no-swiping">
      <div className="log-title">
        <div>
          <div className="log-path">{label}</div>
          <h1>Log</h1>
        </div>
        <div style={{ position: 'relative' }}>
          <button type="button" className="log-icon-btn" aria-label="Log options" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)}>
            <FontAwesomeIcon icon={faEllipsisH} />
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
            </div>
          )}
        </div>
      </div>

      <div className="log-daynav">
        <button type="button" className="log-icon-btn" aria-label="Previous day with entries" disabled={!prevDay} onClick={() => goDay(prevDay)}>
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        <button type="button" className="log-day-label" onClick={() => setCalOpen((v) => !v)} aria-label="Pick a day" aria-expanded={calOpen}>
          <div className="log-day-date" data-testid="day-label">
            {formatDayLong(day)}
          </div>
          <div className="log-day-sub">{sub}</div>
        </button>
        {!isToday && (
          <button type="button" className="log-today-btn" onClick={() => goDay(todayKey)}>
            Today
          </button>
        )}
        <button type="button" className="log-icon-btn" aria-label="Next day with entries" disabled={!nextDay} onClick={() => goDay(nextDay)}>
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>
      {editing && editing.day !== day && (
        <div className="log-banner" role="status">
          <span>Editing an entry from {formatDayLong(editing.day)}</span>
          <button type="button" onClick={() => goDay(editing.day)}>
            Go to it
          </button>
        </div>
      )}
      {calOpen && <Calendar selected={day} daysWithEntries={daySet} onPick={(d) => goDay(d)} onClose={() => setCalOpen(false)} />}

      {mode === 'time-tracker' && summary.running && isToday && (
        <div className="log-running" data-testid="now-running">
          Now: <strong>{firstLine(summary.running.text)}</strong> · {formatDuration(now - summary.running.ts)}
        </div>
      )}
      {mode === 'time-tracker' && task && !editing && (
        <button type="button" className="log-continue-top" onClick={() => fill(firstLine(task.text))}>
          <FontAwesomeIcon icon={faPlay} />
          <span className="log-ellipsis">Continue: {firstLine(task.text)}</span>
        </button>
      )}
      {mode === 'time-tracker' && dayEntries.length > 0 && <WorkSummary day={day} summary={summary} week={week} onPickDay={goDay} />}
      {tally && <TallySummary stats={tally} />}
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
            onDelete={onDelete}
          />
        ))}
      </div>

      <Composer
        text={text}
        onText={setText}
        placeholder={placeholder}
        chipLabel={chipText}
        panelOpen={panelOpen}
        onTogglePanel={togglePanel}
        panel={panel}
        panelError={panelError}
        onPanelField={onPanelField}
        onStep={onStep}
        editing={!!editing}
        onResetOrCancel={resetOrCancel}
        onSend={send}
        quickChips={chips}
        onChip={fill}
        suggestions={suggestions}
        onSuggest={fill}
        tallyCodes={codes}
        onTally={logCode}
        showInput={inputVisible}
        onShowInput={() => setOtherOpen(true)}
        inputRef={inputRef}
      />
    </div>
  );
};

export { isLongEntry };
export default LogScreen;
