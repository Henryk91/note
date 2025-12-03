import { Note } from './types';

type Callback<T = any> = (data: T) => void;

export function logoutUser(next: Callback) {
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

async function refreshToken(): Promise<Response> {
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

export async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  const res = await fetch(url, {
    credentials: 'include',
    ...options,
  });

  if (res.status === 401) {
    const refRes = await refreshToken();
    if (refRes?.ok) return apiFetch(url, options);
  }

  return res;
}

export function getNoteNames(next: Callback<string[]>) {
  apiFetch(`/api/note-names`, {
    credentials: 'include',
  })
    .then((res) => res?.json())
    .then((data) => next(data))
    .catch((error) => {
      console.log('Error:', error);
      next([]);
    });
}

export function getAllNotes(next: Callback<Note[]>) {
  apiFetch('/api/note?user=all')
    .then((res) => res?.json())
    .then((data) => next(data))
    .catch((error) => {
      console.log('Error:', error);
      next(error);
    });
}

export function getMyNotesRec(user: string, next: Callback<Note[]>) {
  apiFetch(`/api/note?user=${user}`)
    .then((res) => res?.json())
    .then((data) => next(data))
    .catch((error) => {
      console.log('Error:', error);
      next(error);
    });
}

export function getNote(user: string, noteHeading: string, next: Callback<Note | string>) {
  apiFetch(`/api/note?user=${user}&noteHeading=${noteHeading}`)
    .then((res) => res?.json())
    .then((data) => next(data))
    .catch((error) => {
      console.log('Error:', error);
      next(error);
    });
}

export function loginRequest(note: any, next: Callback) {
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

export function createAccount(note: any, next: Callback) {
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

export function updateOneNoteRec(note: any, done: Callback<Response>) {
  const sendData = JSON.parse(JSON.stringify(note));
  const { dataLable } = note.person;

  const newLable = dataLable[dataLable.length - 1];
  sendData.person.dataLable = newLable;

  const savedItems = localStorage.getItem('updateOneNote');
  let toUpdate: any[] = [];
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
            (item: any) => JSON.stringify(item) !== JSON.stringify(toUpdateNote),
          );
          if (saveItemArray.length > 0) {
            localStorage.setItem('updateOneNote', JSON.stringify(saveItemArray));
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

export function updateNote(note: any) {
  const savedItems = localStorage.getItem('updateNote');
  let toUpdate: any[] = [];
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

export function saveNewNote(newNote: any) {
  apiFetch('/api/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newNote),
  }).then((response) => console.log(response));
}

export function getNotesV2(parentId, next) {
  apiFetch("/api/note-v2" + (parentId && parentId !== "" ? `?parentId=${parentId}` : ""))
    .then((res) => res?.json())
    .then((data) => next(data))
    .catch((error) => {
      console.log("Error:", error);
      next({});
    });
}

export function getAllNotesV2(parentId, next) {
  apiFetch("/api/note-v2/with-children" + (parentId && parentId !== "" ? `?parentId=${parentId}` : ""))
    .then((res) => res?.json())
    .then((data) => next(data))
    .catch((error) => {
      console.log("Error:", error);
      next({});
    });
}