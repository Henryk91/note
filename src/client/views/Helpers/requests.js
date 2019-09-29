export function getNoteNames(next) {
  const loginKey = localStorage.getItem('loginKey');
  fetch(`${'/api/note-names?tempPass='}${loginKey}`)
    .then(res => res.json())
    .then((data) => {
      if (data === 'Logout User') {
        localStorage.removeItem('loginKey');
        localStorage.removeItem('user');
        window.location.reload();
      } else {
        next(data);
      }
    })
    .catch((error) => {
      next(error);
    });
}

export function getAllNotes(next) {
  const loginKey = localStorage.getItem('loginKey');
  fetch(`${'/api/note?user=all&tempPass='}${loginKey}`)
    .then(res => res.json())
    .then((data) => {
      if (data === 'Logout User') {
        localStorage.removeItem('loginKey');
        localStorage.removeItem('user');
        window.location.reload();
      } else {
        next(data);
      }
    })
    .catch((error) => {
      next(error);
    });
}

export function getMyNotes(user, next) {
  const loginKey = localStorage.getItem('loginKey');
  fetch(`/api/note?user=${user}&tempPass=${loginKey}`)
    .then(res => res.json())
    .then((data) => {
      if (data === 'Logout User') {
        localStorage.removeItem('loginKey');
        localStorage.removeItem('user');
        window.location.reload();
      } else {
        next(data);
      }
    })
    .catch((error) => {
      next(error);
    });
}

export function getNote(user, noteHeading, next) {
  const loginKey = localStorage.getItem('loginKey');
  fetch(`/api/note?user=${user}&tempPass=${loginKey}&noteHeading=${noteHeading}`)
    .then(res => res.json())
    .then((data) => {
      if (data === 'Logout User') {
        localStorage.removeItem('loginKey');
        localStorage.removeItem('user');
        window.location.reload();
      } else {
        next(data);
      }
    })
    .catch((error) => {
      next(error);
    });
}

export function loginRequest(note, next) {
  fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(note)
  })
    .then(res => res.json())
    .then((data) => {
      next(data);
    })
    .catch((error) => {
      next(error);
    });
}

export function createAccount(note, next) {
  fetch('/api/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(note)
  })
    .then(res => res.json())
    .then((data) => {
      next(data);
    })
    .catch((error) => {
      next(error);
    });
}

export function updateNote(note) {
  const loginKey = localStorage.getItem('loginKey');
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
    fetch(`/api/update?tempPass=${loginKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(toUpdateNote)
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
  fetch('/api/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(newNote)
  }).then(response => console.log(response));
}
