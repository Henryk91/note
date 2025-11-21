export const docId = () => {
  let text = '';

  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < 20; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

export const getPerson = (notes, propForId, propNoteNames) => {
  if (propForId === 'note-name') {
    return propNoteNames;
  }
  const person =
    notes && notes[0]
      ? notes.filter((val) => val.id === propForId.params.id)[0]
      : null;

  if (person && person.id === 'main') {
    person.dataLable = person.dataLable.filter(
      (note) => !note.tag.startsWith('Sub: '),
    );
  }
  return person;
};