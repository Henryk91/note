import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTimes } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Note } from '../../../../shared/utils/Helpers/types';
import { RootState } from '../../../../core/store';

const onlyUnique = (value: string, index: number, self: string[]) => self.indexOf(value) === index;

const createList = (notes: Note[] | null, theme: string) => {
  const themeBorder = `${theme.toLowerCase()}-border-thick`;

  if (notes) {
    return notes.map((person) => {
      const dataLable = person.dataLable ? [...person.dataLable].map((dataL: any) => dataL.tag) : [];
      const noteCount = dataLable.filter(onlyUnique).length;
      return (
        <Link key={person.id} style={{ textDecoration: 'none' }} to={`/notes/${person.id}`}>
          <div className="listNameButton dark-hover">
            <div className={`listCountBox ${themeBorder}`}> {noteCount} </div>
            <h3>{person.heading}</h3>
          </div>
        </Link>
      );
    });
  }
  return null;
};

type HomeProps = {};

import { useNotesWithChildren } from '../../hooks/useNotesQueries';

const Home: React.FC<HomeProps> = () => {
  const selectedNoteName = useSelector((state: RootState) => state.person.selectedNoteName);
  const theme = useSelector((state: RootState) => state.theme.themeLower);

  const { isLoading } = useNotesWithChildren(selectedNoteName || undefined, !!selectedNoteName);
  const byId = useSelector((state: RootState) => state.person.byId);

  const notes = React.useMemo(() => {
    if (!byId || !selectedNoteName) return null;

    // If the notebook itself is in the data, its dataLable contains the immediate children
    if (byId[selectedNoteName]) {
      const parentNode = byId[selectedNoteName];
      if (parentNode.dataLable && parentNode.dataLable.length > 0) {
        return parentNode.dataLable.map((item: any) => {
          // If the child is already a full note in the map, use it.
          // Otherwise, create a placeholder Note object for createList.
          return (
            byId[item.id] || {
              id: item.id,
              heading: item.name || item.content?.data || 'Unnamed',
              dataLable: [],
            }
          );
        });
      }
    }

    const allNotes = Object.values(byId) as Note[];

    // Safety check: Filter for valid notes that have a heading and are not the parent itself
    let filtered = allNotes.filter((n) => n.id !== selectedNoteName && (n.heading || n.dataLable));
    return filtered.length > 0 ? filtered : null;
  }, [byId, selectedNoteName]);

  // Safely wrap createList call with the new memoized notes
  const listItems = React.useMemo(() => {
    if (!notes || notes.length === 0) return null;
    return createList(notes, theme);
  }, [notes, theme]);

  const themeBack = `${theme}-back`;
  const themeHover = `${theme}-hover`;

  const logOut = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  if (isLoading) return <h3>Loading notes...</h3>;

  return (
    <div id="home1">
      <button
        className={`backButton ${themeBack}`}
        onClick={() => {
          logOut();
        }}
      >
        <FontAwesomeIcon icon={faTimes} />
      </button>
      {selectedNoteName && selectedNoteName !== 'None' ? (
        <div className="detail-scroll">
          <Link
            style={{ textDecoration: 'none' }}
            className={`detailAddButton ${themeHover} ${themeBack}`}
            to="/new-note/"
          >
            <FontAwesomeIcon icon={faPlus} />
          </Link>
        </div>
      ) : null}
      {notes && notes.length > 0 ? (
        <div className="slide-in">
          <div key="page-content-top" className="page-content-top1" />
          {listItems}
          <br />
        </div>
      ) : (
        <h3>{selectedNoteName ? 'No notes found in this notebook.' : 'Please select a notebook in the sidebar.'}</h3>
      )}
    </div>
  );
};

export default Home;
