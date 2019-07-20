export function getAllNotes(next) {
  var loginKey = localStorage.getItem("loginKey")
    fetch(`/api/note?user=all`+ '&tempPass='+loginKey)
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

export function getMyNotes(user, next) {
  var loginKey = localStorage.getItem("loginKey")
    fetch(`/api/note?user=` + user + '&tempPass='+loginKey)
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
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(note),
    })
        .then(res => res.json())
        .then(data => {
            next(data)
        })
        .catch((error) => {
            next(error)
        });
}

export function createAccount(note, next) {

    fetch(`/api/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(note),
    })
        .then(res => res.json())
        .then(data => {
            next(data)
        })
        .catch((error) => {
            next(error)
        });
}

export function updateNote(note, next) {

    fetch(`/api/update`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(note),
    })
        .then(response => console.log(response));
}
export function saveNewNote(newNote, next) {

    fetch(`/api/save`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(newNote),
    })
        .then(response => console.log(response));

}
