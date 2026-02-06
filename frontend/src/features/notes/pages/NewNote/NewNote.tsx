import React, { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCheck } from '@fortawesome/free-solid-svg-icons';
import EditNoteCheck from '../../components/EditNoteCheck/EditNoteCheck';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../../core/store';
import { addFolder, addItem } from '../../../../shared/utils/Helpers/crud';
import { NoteContent } from '../../../../shared/utils/Helpers/types';
import { triggerLastPageReload } from '../../../../features/auth/store/personSlice';

type NewNoteProps = {};

const NewNote: React.FC<NewNoteProps> = () => {
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.theme.themeLower);
  const { selectedNoteName } = useSelector((state: RootState) => state.person);
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
    const heading = (isEditing ? 'Sub: ' : '') + (form.heading as HTMLInputElement).value;
    let number = (form.number as HTMLInputElement).value;
    let tag = (form.tagType as HTMLInputElement).value;

    if (tag === 'Note') tag = (form.tagTypeText as HTMLInputElement).value;

    const textTag = (form.tagTypeText as HTMLInputElement).value;

    let content: NoteContent = { data: number };

    if (tag === 'Log') content.date = textTag;

    if (selectedNoteName === undefined) return;

    addFolder(heading, selectedNoteName, (mainFolder) => {
      addFolder(tag, mainFolder?.id, (subFolder) => {
        addItem(content, subFolder?.id, (data) => {
          if (data) dispatch(triggerLastPageReload());
          window.history.back();
        });
      });
    });
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
        <input className={themeBack} name="heading" type="text" placeholder="Headings" required id="heading" />
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
