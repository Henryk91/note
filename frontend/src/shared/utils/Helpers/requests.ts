import { sendOrQueueJSON } from '../../../offlineQueue/queue';

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
