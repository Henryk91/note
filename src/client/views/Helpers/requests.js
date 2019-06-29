// export function getAllNotes(next) {
//     fetch(`/api/note?user=all`)
//         .then(res => res.json())
//         .then(data => {
//             next(data)
//         })
//         .catch((error) => {
//             next(error)
//         });
// }

export function getMyNotes(user, next) {

    fetch(`/api/note?user=` + user)
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
