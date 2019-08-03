export function getNoteNames(next) {
  var loginKey = localStorage.getItem('loginKey');
  fetch(`/api/note-names` + '?tempPass=' + loginKey)
    .then(res => res.json())
    .then(data => {
      if (data === 'Logout User') {
        localStorage.removeItem('loginKey');
        localStorage.removeItem('user');
        window.location.reload();
      } else {
        next(data);
      }
    })
    .catch(error => {
      next(error);
    });
}

export function getAllNotes(next) {
  var loginKey = localStorage.getItem('loginKey');
  fetch(`/api/note?user=all` + '&tempPass=' + loginKey)
    .then(res => res.json())
    .then(data => {
      if (data === 'Logout User') {
        localStorage.removeItem('loginKey');
        localStorage.removeItem('user');
        window.location.reload();
      } else {
        next(data);
      }
    })
    .catch(error => {
      next(error);
    });
}

export function getMyNotes(user, next) {
  var loginKey = localStorage.getItem('loginKey');
  fetch(`/api/note?user=` + user + '&tempPass=' + loginKey)
    .then(res => res.json())
    .then(data => {
      if (data === 'Logout User') {
        localStorage.removeItem('loginKey');
        localStorage.removeItem('user');
        window.location.reload();
      } else {
        next(data);
      }
    })
    .catch(error => {
      next(error);
    });
}

export function getNote(user, noteHeading, next) {
  var loginKey = localStorage.getItem("loginKey")
    fetch(`/api/note?user=` + user + '&tempPass=' + loginKey + "&noteHeading=" + noteHeading)
        .then(res => res.json())
        .then(data => {
            if(data === "Logout User"){
              localStorage.removeItem("loginKey")
              localStorage.removeItem("user")
              window.location.reload()
            } else {
              next(data)
            }
        })
        .catch((error) => {
            next(error)
        });
}

export function loginRequest(note, next) {
  fetch(`/api/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(note)
  })
    .then(res => res.json())
    .then(data => {
      next(data);
    })
    .catch(error => {
      next(error);
    });
}

export function createAccount(note, next) {
  fetch(`/api/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(note)
  })
    .then(res => res.json())
    .then(data => {
      next(data);
    })
    .catch(error => {
      next(error);
    });
}

export function updateNote(note, next) {
  var loginKey = localStorage.getItem('loginKey');
  let savedItems = localStorage.getItem('updateNote');
  let toUpdate = [];
  if (savedItems) {
    toUpdate = JSON.parse(savedItems);
    toUpdate.push(note);
  } else {
    toUpdate = [note];
  }
  localStorage.setItem('updateNote', JSON.stringify(toUpdate));

  toUpdate.forEach(note => {
    fetch(`/api/update?tempPass=` + loginKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(note)
    }).then(response => {
      let savedItems = localStorage.getItem('updateNote');
      if (savedItems) {
        let saveItemArray = JSON.parse(savedItems);

        if (saveItemArray.length > 1) {
          saveItemArray = saveItemArray.slice(1);
          localStorage.setItem('updateNote', JSON.stringify(saveItemArray));
        } else {
          if (saveItemArray.length === 0) {
            localStorage.setItem('updateNote', JSON.stringify([note]));
          } else {
            localStorage.removeItem('updateNote');
          }
        }
      }
      console.log(response);
    });
  });
}
export function saveNewNote(newNote, next) {
  fetch(`/api/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(newNote)
  }).then(response => console.log(response));
}
