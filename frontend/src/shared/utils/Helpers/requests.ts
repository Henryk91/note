import { sendOrQueueJSON } from '../../../offlineQueue/queue';
import { apiFetch } from './apiFetch';
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
      localStorage.clear();
      sessionStorage.clear();
      next(data);
    })
    .catch((error) => {
      console.log('Error:', error);
      next(error);
    });
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

export function saveNewNote(newNote: any) {
  apiFetch('/api/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newNote),
  }).then((response) => console.log(response));
}

export function getNotesV2ByParentId(parentId, next) {
  apiFetch('/api/note-v2' + (parentId && parentId !== '' ? `?parentId=${parentId}` : ''))
    .then((res) => res?.json())
    .then((data) => next(data))
    .catch((error) => {
      console.log('Error:', error);
      next({});
    });
}

export function getNotesV2WithChildrenByParentId(parentId, next) {
  if (!navigator.onLine) {
    next({});
    return;
  }
  apiFetch('/api/note-v2/with-children' + (parentId && parentId !== '' ? `?parentId=${parentId}` : ''))
    .then((res) => res?.json())
    .then((data) => next(data))
    .catch((error) => {
      console.log('Error:', error);
      next({});
    });
}

export function createNoteV2(newNote, next) {
  sendOrQueueJSON('/api/note-v2', newNote, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((data) => {
      next(data?.response);
    })
    .catch((error) => {
      console.log('Error:', error);
      next(error);
    });
}

export function updateNoteV2(newNote, next) {
  sendOrQueueJSON('/api/note-v2', newNote, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((data) => {
      next(data.response);
    })
    .catch((error) => {
      console.log('Error:', error);
      next(error);
    });
}

export function deleteNoteV2(note, next) {
  sendOrQueueJSON('/api/note-v2', note, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((data) => {
      next(data.response);
    })
    .catch((error) => {
      console.log('Error:', error);
      next(error);
    });
}
