export function logoutUser(next) {
  fetch('/api/logout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: '',
  })
    .then((res) => res?.json())
    .then((data) => {
      console.log('logoutUser localStorage.clear()');
      localStorage.clear();
      next(data);
    })
    .catch((error) => {
      console.log('Error:', error);
      next(error);
    });
}

async function refreshToken() {
  const res = await fetch('/api/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: '',
  });

  if (res.status === 401) {
    console.log('refreshToken localStorage.clear()');
    localStorage.clear();
    window.location.reload();
  }
  return res;
}

export async function apiFetch(url, options) {
  const res = await fetch(url, {
    credentials: 'include',
    ...options,
  });

  if (res.status === 401) {
    const refRes = await refreshToken();
    // if (refRes?.ok) return await apiFetch(url, options);
    if (refRes?.ok) return apiFetch(url, options);
    // return;
  }

  return res;
}

export function getNoteNames(next) {
  apiFetch(`/api/note-names`, {
    credentials: 'include', // send cookies (access_token, refresh_token)
  })
    .then((res) => res?.json())
    .then((data) => next(data))
    .catch((error) => {
      console.log('Error:', error);
      next(error);
    });
}

export function getAllNotes(next) {
  apiFetch('/api/note?user=all')
    .then((res) => res?.json())
    .then((data) => next(data))
    .catch((error) => {
      console.log('Error:', error);
      next(error);
    });
}

export function getMyNotesRec(user, next) {
  apiFetch(`/api/note?user=${user}`)
    .then((res) => res?.json())
    .then((data) => next(data))
    .catch((error) => {
      console.log('Error:', error);
      next(error);
    });
}

export function getNote(user, noteHeading, next) {
  apiFetch(`/api/note?user=${user}&noteHeading=${noteHeading}`)
    .then((res) => res?.json())
    .then((data) => next(data))
    .catch((error) => {
      console.log('Error:', error);
      next(error);
    });
}

export function loginRequest(note, next) {
  fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(note),
  })
    .then((res) => res?.json())
    .then((data) => {
      next(data);
    })
    .catch((error) => {
      console.log('Error:', error);
      next(error);
    });
}

export function createAccount(note, next) {
  fetch('/api/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(note),
  })
    .then((res) => res?.json())
    .then((data) => {
      next(data);
    })
    .catch((error) => {
      next(error);
    });
}

export function updateOneNoteRec(note, done) {
  const sendData = JSON.parse(JSON.stringify(note));
  const { dataLable } = note.person;

  const newLable = dataLable[dataLable.length - 1];
  sendData.person.dataLable = newLable;

  const savedItems = localStorage.getItem('updateOneNote');
  let toUpdate = [];
  if (savedItems) {
    toUpdate = JSON.parse(savedItems);
    toUpdate.push(sendData);
  } else {
    toUpdate = [sendData];
  }
  localStorage.setItem('updateOneNote', JSON.stringify(toUpdate));

  toUpdate.forEach((toUpdateNote) => {
    apiFetch(`/api/update-one`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(toUpdateNote),
    }).then((response) => {
      if (response?.ok) {
        const updateSavedItems = localStorage.getItem('updateOneNote');
        if (updateSavedItems) {
          let saveItemArray = JSON.parse(updateSavedItems);
          saveItemArray = saveItemArray.filter(
            (item) => JSON.stringify(item) !== JSON.stringify(toUpdateNote),
          );
          console.log(saveItemArray);
          if (saveItemArray.length > 0) {
            localStorage.setItem(
              'updateOneNote',
              JSON.stringify(saveItemArray),
            );
          } else {
            localStorage.removeItem('updateOneNote');
            done(response);
          }
        }
      } else {
        done(response);
      }
    });
  });
}

export function updateNote(note) {
  const savedItems = localStorage.getItem('updateNote');
  let toUpdate = [];
  if (savedItems) {
    toUpdate = JSON.parse(savedItems);
    toUpdate.push(note);
  } else {
    toUpdate = [note];
  }
  localStorage.setItem('updateNote', JSON.stringify(toUpdate));

  toUpdate.forEach((toUpdateNote) => {
    apiFetch(`/api/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(toUpdateNote),
    }).then((response) => {
      const updateSavedItems = localStorage.getItem('updateNote');
      if (updateSavedItems) {
        let saveItemArray = JSON.parse(updateSavedItems);

        if (saveItemArray.length > 1) {
          saveItemArray = saveItemArray.slice(1);
          localStorage.setItem('updateNote', JSON.stringify(saveItemArray));
        } else if (saveItemArray.length === 0) {
          localStorage.setItem('updateNote', JSON.stringify([toUpdateNote]));
        } else {
          localStorage.removeItem('updateNote');
        }
      }
      console.log(response);
    });
  });
}
export function saveNewNote(newNote) {
  apiFetch('/api/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newNote),
  }).then((response) => console.log(response));
}
