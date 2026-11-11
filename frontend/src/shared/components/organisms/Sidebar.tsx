import React from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  IconBook,
  IconBookOff,
  IconBooks,
  IconBrain,
  IconCheck,
  IconChevronRight,
  IconHourglass,
  IconLogout,
  IconNotes,
  IconTrash,
  IconWorld,
} from '@tabler/icons-react';
import { setTheme } from '../../../core/store/themeSlice';
import { RootState } from '../../../core/store';
import { useNoteNames } from '../../../features/notes/hooks/useNotesQueries';
import { useNotesLogic } from '../../../features/notes/hooks/useNotesLogic';
import { logoutUser } from '../../utils/Helpers/requests';
import { useHeader } from '../../header/headerStore';
import './menu.css';

export type SidebarProps = {};

/** Theme order and swatch colours of docs/mockups/menu-login.html. */
const THEME_SWATCHES: Array<{ name: string; style: React.CSSProperties }> = [
  { name: 'Dark', style: { background: '#0079AE' } },
  { name: 'Ocean', style: { background: '#38CDB8' } },
  { name: 'Green', style: { background: '#39CB7D' } },
  { name: 'Night', style: { background: '#27343B', boxShadow: 'inset 0 0 0 1px #3AB0E2' } },
  { name: 'Red', style: { background: '#BB3B00' } },
];

const ICON = 17;

const Row: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; check?: string; chevron?: boolean; danger?: boolean }> = ({
  icon,
  label,
  onClick,
  check,
  chevron,
  danger,
}) => (
  <button type="button" className={`menu-row ${danger ? 'is-danger' : ''}`} onClick={onClick}>
    {icon}
    <span className="menu-nm">{label}</span>
    {check && <IconCheck size={ICON} className="menu-ck" aria-label={check} />}
    {chevron && <IconChevronRight size={14} className="menu-chev" aria-hidden />}
  </button>
);

/** Apps, Theme and Account (desktop popover), plus Notebooks first on the phone menu page. */
export const MenuContent: React.FC<{ withNotebooks: boolean; onDone?: () => void }> = ({ withNotebooks, onDone }) => {
  const dispatch = useDispatch();
  const history = useHistory();
  const authToken = useSelector((state: RootState) => state.person.authToken);
  const selected = useSelector((state: RootState) => state.person.selectedNoteName);
  const theme = useSelector((state: RootState) => state.theme.themeLower);
  const { data: noteNames } = useNoteNames(!!authToken && withNotebooks);
  const { noteDetailSet } = useNotesLogic();

  const go = (path: string) => {
    onDone?.();
    history.push(path);
  };
  // Site Track holds automated visit logs: it is listed last, apart from the personal notebooks.
  const names = noteNames ? [...noteNames.filter((n) => n !== 'Site Track'), 'All', 'None', ...noteNames.filter((n) => n === 'Site Track')] : [];
  const nbIcon = (n: string) =>
    n === 'All' ? <IconBooks size={ICON} /> : n === 'None' ? <IconBookOff size={ICON} /> : n === 'Site Track' ? <IconWorld size={ICON} /> : <IconBook size={ICON} />;

  return (
    <>
      {withNotebooks && (
        <>
          <div className="menu-cap">Notebooks</div>
          <div className="menu-card">
            {names.map((n) => (
              <Row
                key={n}
                icon={nbIcon(n)}
                label={n}
                check={n === selected ? 'Current notebook' : undefined}
                onClick={() => {
                  noteDetailSet({ noteName: n });
                  go('/notes/main');
                }}
              />
            ))}
          </div>
        </>
      )}
      <div className="menu-cap">Apps</div>
      <div className="menu-card">
        <Row icon={<IconNotes size={ICON} />} label="Notes" chevron onClick={() => go('/notes/main')} />
        <Row icon={<IconBrain size={ICON} />} label="Memento" chevron onClick={() => go('/memento')} />
        <Row icon={<IconHourglass size={ICON} />} label="Pomodoro" chevron onClick={() => go('/pomodoro')} />
        <Row icon={<IconTrash size={ICON} />} label="Recently Deleted" chevron onClick={() => go('/recently-deleted')} />
      </div>
      <div className="menu-cap">Theme</div>
      <div className="menu-card">
        {THEME_SWATCHES.map((t) => (
          <Row
            key={t.name}
            icon={<span className="menu-sw" style={t.style} />}
            label={t.name}
            check={theme === t.name.toLowerCase() ? 'Current theme' : undefined}
            onClick={() => dispatch(setTheme(t.name))}
          />
        ))}
      </div>
      <div className="menu-cap">Account</div>
      <div className="menu-card">
        <Row icon={<IconLogout size={ICON} />} label="Log out" danger onClick={() => logoutUser(() => window.location.reload())} />
      </div>
    </>
  );
};

/** Phone menu (`/notes/note-names`, menu-login.html 1): full screen, grouped cards, "×" closes it. */
export const Sidebar: React.FC<SidebarProps> = () => {
  const history = useHistory();
  useHeader({ layout: 'menu', title: 'Menu', close: () => history.push('/notes/main') });
  return (
    <div className="menu-page">
      <MenuContent withNotebooks />
    </div>
  );
};

/** Desktop: the same menu as a 280 px popover from the hamburger (menu-login.html 3); notebooks are in the sidebar. */
export const MenuPopover: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="menu-pop" role="dialog" aria-label="Menu">
    <MenuContent withNotebooks={false} onDone={onClose} />
  </div>
);
