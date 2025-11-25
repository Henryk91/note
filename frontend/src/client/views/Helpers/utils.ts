import { Note, NoteLabel } from './types';

export const docId = (): string => {
  let text = '';

  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < 20; i += 1) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

export const getPerson = (
  notes: Note[] | null,
  propForId: any,
  propNoteNames: Note | null,
): Note | null => {
  if (propForId === 'note-name') {
    return propNoteNames;
  }
  const person =
    notes && notes[0] ? notes.filter((val) => val.id === propForId?.params.id)[0] : null;

  if (person && person.id === 'main' && person.dataLable) {
    person.dataLable = person.dataLable.filter((note) => !note.tag.startsWith('Sub: '));
  }
  return person;
};

export const compareSort = (a: Note, b: Note): number => {
  const nameA = a.heading.toUpperCase();
  const nameB = b.heading.toUpperCase();

  if (nameA > nameB) return 1;
  if (nameA < nameB) return -1;
  return 0;
};

const checkIsToday = (dateString: string): boolean => {
  const today = new Date();
  const someDate = new Date(dateString);
  return (
    someDate.getDate() === today.getDate() &&
    someDate.getMonth() === today.getMonth() &&
    someDate.getFullYear() === today.getFullYear()
  );
};

export const getLogDuration = (nextItem: string | undefined, parsedItem: NoteLabel) => {
  const parsedNextItem = nextItem ? JSON.parse(nextItem) : null;

  const getTimeDifference = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const duration = endDate.getTime() - startDate.getTime();
    let minutes: number | string = Math.floor((duration / (1000 * 60)) % 60);
    let hours: number | string = Math.floor((duration / (1000 * 60 * 60)) % 24);

    hours = hours < 10 ? `0${hours}` : hours;
    minutes = minutes < 10 ? `0${minutes}` : minutes;

    return `${hours}:${minutes}`;
  };

  let nextDate = parsedNextItem ? parsedNextItem.date : null;

  if (!nextDate) {
    if (checkIsToday(parsedItem.date || '')) {
      nextDate = `${new Date()}`;
    }
  }

  const duration = nextDate ? `(${getTimeDifference(parsedItem.date || '', nextDate)})` : '';
  return duration;
};
