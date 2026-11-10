import { IconArrowUp, IconCheck, IconChevronDown, IconChevronUp, IconClock } from '@tabler/icons-react';
import React, { useEffect, useRef } from 'react';
import { PanelValue } from './entryTime';

type Unit = 'd' | 'h' | 'min';

type ComposerProps = {
  text: string;
  onText: (v: string) => void;
  placeholder: string;
  chipLabel: string;
  panelOpen: boolean;
  onTogglePanel: () => void;
  panel: PanelValue;
  panelError: string | null;
  onPanelField: (field: keyof PanelValue, value: string) => void;
  onStep: (unit: Unit, direction: 1 | -1) => void;
  editing: boolean;
  onResetOrCancel: () => void;
  onSend: () => void;
  quickChips?: string[];
  onChip?: (text: string) => void;
  suggestions?: string[];
  onSuggest?: (text: string) => void;
  tallyCodes?: string[];
  onTally?: (code: string) => void;
  /** Tally logs hide the text box until "Other" is tapped. */
  showInput: boolean;
  onShowInput?: () => void;
  inputRef: React.RefObject<HTMLTextAreaElement>;
};

const isTouch = () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

const Stepper: React.FC<{ label: string; unit: Unit; onStep: ComposerProps['onStep'] }> = ({ label, unit, onStep }) => {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => stop, []);
  const hold = (dir: 1 | -1) => {
    // Holding the button repeats the step.
    timer.current = setTimeout(function repeat() {
      onStep(unit, dir);
      timer.current = setTimeout(repeat, 90);
    }, 450);
  };
  const names = { d: 'day', h: 'hour', min: 'minute' } as const;
  return (
    <div className="log-stepper">
      <button
        type="button"
        aria-label={`One ${names[unit]} earlier`}
        onClick={() => onStep(unit, -1)}
        onPointerDown={() => hold(-1)}
        onPointerUp={stop}
        onPointerLeave={stop}
      >
        −
      </button>
      <span>{label}</span>
      <button
        type="button"
        aria-label={`One ${names[unit]} later`}
        onClick={() => onStep(unit, 1)}
        onPointerDown={() => hold(1)}
        onPointerUp={stop}
        onPointerLeave={stop}
      >
        +
      </button>
    </div>
  );
};

export const Composer: React.FC<ComposerProps> = (props) => {
  const {
    text,
    onText,
    placeholder,
    chipLabel,
    panelOpen,
    onTogglePanel,
    panel,
    panelError,
    onPanelField,
    onStep,
    editing,
    onResetOrCancel,
    onSend,
    quickChips,
    onChip,
    suggestions,
    onSuggest,
    tallyCodes,
    onTally,
    showInput,
    onShowInput,
    inputRef,
  } = props;

  // The box grows with its content (up to ~6 lines, then scrolls).
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = '38px';
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  }, [text, showInput, inputRef]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onSend();
    } else if (e.key === 'Enter' && !e.shiftKey && !isTouch()) {
      // Desktop: Enter sends, Shift+Enter adds a line. On touch devices the return key makes a new line.
      e.preventDefault();
      onSend();
    }
  };

  const onTimeKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      onStep('min', 1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      onStep('min', -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div>
      {panelOpen && (
        <div className="log-panel" data-testid="time-panel">
          <div className="log-panel-head">
            <span>{editing ? 'Editing entry' : 'Entry date and time'}</span>
            <button type="button" onClick={onResetOrCancel}>
              {editing ? 'Cancel edit' : 'Reset to now'}
            </button>
          </div>
          <div className="log-panel-fields">
            <label style={{ flex: 1.3 }}>
              Date (dd.mm.yyyy)
              <input
                aria-label="Entry date"
                inputMode="numeric"
                placeholder="10.11.2026"
                value={panel.date}
                onChange={(e) => onPanelField('date', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onSend())}
              />
            </label>
            <label style={{ flex: 1 }}>
              Time (24 h)
              <input
                aria-label="Entry time"
                inputMode="numeric"
                placeholder="14:30"
                value={panel.time}
                onChange={(e) => onPanelField('time', e.target.value)}
                onKeyDown={onTimeKey}
              />
            </label>
          </div>
          <div className="log-steppers">
            <Stepper label="1 d" unit="d" onStep={onStep} />
            <Stepper label="1 h" unit="h" onStep={onStep} />
            <Stepper label="1 min" unit="min" onStep={onStep} />
          </div>
          {panelError && (
            <div className="log-error" role="alert">
              {panelError}
            </div>
          )}
        </div>
      )}
      <div className="log-composer">
        {tallyCodes && tallyCodes.length > 0 && !editing && (
          <div className="log-tally" data-testid="tally-buttons">
            {tallyCodes.map((code) => (
              <button type="button" key={code} onClick={() => onTally?.(code)} aria-label={`Log ${code}`}>
                {code}
              </button>
            ))}
          </div>
        )}
        <button type="button" className="log-time-chip" onClick={onTogglePanel} aria-expanded={panelOpen} aria-label="Entry date and time">
          <IconClock size={"1em"} />
          <span data-testid="time-chip">{chipLabel}</span>
          {panelOpen ? <IconChevronDown size={"1em"} style={{ fontSize: 13 }} /> : <IconChevronUp size={"1em"} style={{ fontSize: 13 }} />}
        </button>
        {showInput ? (
          <div className="log-input-row">
            <textarea
              ref={inputRef}
              rows={1}
              value={text}
              placeholder={placeholder}
              aria-label="Log entry text"
              className="swiper-no-swiping"
              onChange={(e) => onText(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <button
              type="button"
              className="log-icon-btn log-send"
              aria-label={editing ? 'Save entry' : 'Add entry'}
              onClick={onSend}
            >
              {editing ? <IconCheck size={"1em"} /> : <IconArrowUp size={"1em"} />}
            </button>
          </div>
        ) : (
          <button type="button" style={{ color: 'var(--accent-text)', fontSize: 13 }} onClick={onShowInput}>
            Other text...
          </button>
        )}
      </div>
    </div>
  );
};
