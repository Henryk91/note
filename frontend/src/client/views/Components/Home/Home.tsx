import React from 'react';
import { Link } from 'react-router-dom';
import { Note } from '../../Helpers/types';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store';

const onlyUnique = (value: string, index: number, self: string[]) => self.indexOf(value) === index;

const createList = (notes: Note[] | null, theme: string) => {
  const themeBorder = `${theme.toLowerCase()}-border-thick`;

  if (notes) {
    return notes.map((person) => {
      const dataLable = [...person.dataLable].map((dataL) => dataL.tag);
      const noteCount = dataLable.filter(onlyUnique).length;
      return (
        <Link
          key={person.id}
          style={{ textDecoration: 'none' }}
          to={`/notes/${person.id}`}
        >
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

type HomeProps = {
  notes: Note[] | null;
  User?: string;
};

const Home: React.FC<HomeProps> = ({ notes, User }) => {
  const theme = useSelector((state: RootState) => state.theme.themeLower);
  const themeBack = `${theme}-back`;
  const themeHover = `${theme}-hover`;

  const logOut = () => {
    console.log('logOut localStorage.clear()');
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div id="home1">
      <button
        className={`backButton ${themeBack}`}
        onClick={() => {
          logOut();
        }}
      >
        <i className="fas fa-times" />
      </button>
      {User !== 'None' ? (
        <div className="detail-scroll">
          <Link
            style={{ textDecoration: 'none' }}
            className={`detailAddButton ${themeHover} ${themeBack}`}
            to="/new-note/"
          >
            <i className="fas fa-plus" />
          </Link>
        </div>
      ) : null}
      {notes ? (
        <div className="slide-in">
          <div key="page-content-top" className="page-content-top1" />
          {createList(notes, theme)}
          <br />
        </div>
      ) : (
        <h3>
          Please add note book name <br /> at the top then click Get Notes
        </h3>
      )}
    </div>
  );
};

export default Home;
