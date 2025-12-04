import React, { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCheck } from '@fortawesome/free-solid-svg-icons';
import EditNoteCheck from '../EditNoteCheck/EditNoteCheck';
import { generateDocId } from '../../Helpers/utils';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store';

type NewNoteProps = {
  set: (payload: any) => void;
};

const NewNote: React.FC<NewNoteProps> = ({ set }) => {
  const theme = useSelector((state: RootState) => state.theme.themeLower);
  const themeBack = `${theme}-back`;
  const themeHover = `${theme}-hover`;

  useEffect(() => {
    const id = setTimeout(() => {
      document.getElementById('heading')?.focus();
    }, 100);
    return () => clearTimeout(id);
  }, []);

  const addNewUser = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const isEditing = localStorage.getItem('new-folder-edit');
    const heading =
      (isEditing ? 'Sub: ' : '') + (form.heading as HTMLInputElement).value;
    let number = (form.number as HTMLInputElement).value;
    let tag = (form.tagType as HTMLInputElement).value;

    if (tag === 'Note') tag = (form.tagTypeText as HTMLInputElement).value;
    const loginKey = localStorage.getItem('loginKey');
    const uniqueId = generateDocId();
    const textTag = (form.tagTypeText as HTMLInputElement).value;
    if (tag === 'Log') {
      number = JSON.stringify({ json: true, date: textTag, data: number });
    }

    const note = {
      id: uniqueId,
      userId: loginKey,
      createdBy: 'Unknown',
      heading,
      dataLable: [{ tag, data: number }],
    };

    set({ note });
    window.history.back();
  };

  return (
    <div>
      <button
        className={`backButton ${themeBack}`}
        onClick={() => {
          window.history.back();
        }}
      >
        <FontAwesomeIcon icon={faArrowLeft} />
      </button>
      <form onSubmit={addNewUser}>
        <br />
        <input
          className={themeBack}
          name="heading"
          type="text"
          placeholder="Headings"
          required
          id="heading"
        />
        <br />
        <EditNoteCheck />
        <button className={`submit-button ${themeHover} ${themeBack}`} type="submit">
          {' '}
          <FontAwesomeIcon icon={faCheck} />
        </button>
      </form>
    </div>
  );
};

export default NewNote;
