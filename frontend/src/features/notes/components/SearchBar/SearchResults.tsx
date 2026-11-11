import React, { useEffect, useRef, useState } from 'react';
import { IconSearch, IconX } from '@tabler/icons-react';
import { createPortal } from 'react-dom';
import { useHistory } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../core/store';
import { apiFetch } from '../../../../shared/utils/Helpers/apiFetch';
import { pathForFolder } from '../../hooks/useFolderUrlSync';
import { formatDayLong, dayKeyOf, parseLogDate } from '../../log/logModel';

type Hit = { id: string; type: 'FOLDER' | 'NOTE' | 'LOG'; parentId: string; name?: string; label: string; date: string | null; snippet: string };

export const logGotoKey = (logId: string) => `log-goto:${logId}`;

/** Phone: the page's search field is the input itself; results drop down under it (the header stays as it is). */
export const PhoneSearch: React.FC<{ label: string }> = ({ label }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const done = () => {
    setQuery('');
    inputRef.current?.blur();
  };
  return (
    <div className="phone-search-wrap">
      <label className="phone-search">
        <IconSearch size={"1em"} aria-hidden />
        <input
          ref={inputRef}
          id="phoneSearchBox"
          type="search"
          className="swiper-no-swiping"
          aria-label={label}
          placeholder={label}
          value={query}
          enterKeyHint="search"
          autoComplete="off"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && done()}
        />
        {query && (
          <button type="button" className="phone-search-clear" aria-label="Clear search" onClick={done}>
            <IconX size={"1em"} />
          </button>
        )}
      </label>
      {query.trim() && <SearchResults query={query} onDone={done} inline />}
    </div>
  );
};

/** Notebooks that are not one tree ("All", "None"): search everything. */
export const searchScope = (notebook: string | null | undefined) => (notebook && notebook !== 'All' && notebook !== 'None' ? notebook : '');

/** Full-text search (notes, log entries, folder names) in the open notebook (all notebooks for All / None); each hit shows its path. */
export const SearchResults: React.FC<{ query: string; onDone: () => void; inline?: boolean }> = ({ query, onDone, inline }) => {
  const history = useHistory();
  const scope = searchScope(useSelector((state: RootState) => state.person.selectedNoteName));
  const [debounced, setDebounced] = useState(query);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isFetching } = useQuery<Hit[]>({
    queryKey: ['notes', 'search', debounced, scope],
    enabled: debounced.length > 0,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const inNotebook = scope ? `&notebook=${encodeURIComponent(scope)}` : '';
      const res = await apiFetch(`/api/search?q=${encodeURIComponent(debounced)}&limit=30${inNotebook}`);
      if (!res.ok) throw new Error(`Search failed: ${res.status}`);
      return res.json();
    },
  });

  const open = (hit: Hit) => {
    if (hit.type === 'LOG') {
      try {
        if (hit.date) sessionStorage.setItem(logGotoKey(hit.parentId), hit.date);
      } catch {
        /* storage unavailable */
      }
      history.push(pathForFolder(hit.parentId));
    } else if (hit.type === 'FOLDER') history.push(pathForFolder(hit.id));
    else history.push(`/n/${encodeURIComponent(hit.id)}`);
    onDone();
  };

  if (!debounced) return null;
  const list = (
    <div className={`search-results ${inline ? 'is-inline' : ''}`} role="listbox" aria-label="Search results">
      {isFetching && !data && <div className="search-empty">Searching...</div>}
      {data && data.length === 0 && <div className="search-empty">No results for &ldquo;{debounced}&rdquo;</div>}
      {data?.map((h) => {
        const ts = parseLogDate(h.date);
        return (
          <button type="button" role="option" aria-selected={false} key={h.id} className="search-hit" onClick={() => open(h)}>
            <span className="search-hit-path">
              {h.label}
              {ts !== null && <> · {formatDayLong(dayKeyOf(ts))}</>}
            </span>
            <span className="search-hit-snippet">{h.snippet || h.name}</span>
          </button>
        );
      })}
    </div>
  );
  // Inline (phone page search): drops down under its input. Header search: portal, as the header has its own
  // stacking context below the page container.
  return inline ? list : createPortal(list, document.body);
};
