require('dotenv').config();

const mongoose = require('mongoose');
mongoose.connect(process.env.DB, { useNewUrlParser: true });

let Schema = mongoose.Schema;

let noteSchema = new Schema({
  id: { type: String, required: true },
  userId: { type: String, required: true },
  createdBy: { type: String, required: true },
  heading: { type: String, required: true },
  // lastName: {type: String, required: true},
  dataLable: { type: Array }
});

let noteUserSchema = new Schema({
  email: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  password: { type: String, required: true },
  tempPass: { type: Array, required: true },
  permId: { type: String, required: true }
});

let Note = mongoose.model('Notes', noteSchema);
let noteUser = mongoose.model('NoteUsers', noteUserSchema);

module.exports = function() {
  this.docId = count => {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < count; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  };

  function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
  }

  this.newUser = (req, done) => {
    let user = req;
    let docId = this.docId(10);
    let permId = this.docId(20);

    user.tempPass = docId;
    user.permId = docId;
    let createUser = new noteUser(user);

    createUser.save((err, data) => {
      if (err) {
        console.log(err);
        done(err.name);
      } else {
      }
    });
    done(docId);
  };

  tempPassCheck = (tempPass, done) => {
    noteUser.find({ tempPass: tempPass }, (err, docs) => {
      if (err) {
        done(err.name);
      } else {
        done(docs);
      }
    })
  }

  this.newNote = (req, done) => {
    let note = req;
    let pass = req.userId;

      tempPassCheck(pass,(docs) => {
      if (docs[0]) {
        permId = docs[0].permId;

        note.userId = docs[0].permId;

        let createNote = new Note(note);

        createNote.save((err, data) => {
          if (err) {
            console.log(err);
            done(err.name);
          } else {
            done('Created');
          }
        });
      } else {
        done('Temp Pass fail');
      }
    });
  };

  this.getAllNotes = (req, done) => {
    let pass = req.query.tempPass;
    let permId = null;

    tempPassCheck(pass,(docs) => {
      if (docs[0]) {
        permId = docs[0].permId;

        Note.find({ userId: permId }, (err, docs) => {
          if (err) {
            console.log(err);
            done('No notes');
          }
          done(docs);
        });
      } else {
        done('Logout User');
      }
    });
  };

  this.userLogin = (req, done) => {
    noteUser.findOne({ email: req.email, password: req.password }, (err, docs) => {
      if (docs && docs.password === req.password) {
        let newTemp = this.docId(30);
        if(docs.tempPass.length > 0) {
          if(docs.tempPass.length > 1) {
           docs.tempPass = docs.tempPass.slice(1)
          }
          docs.tempPass.push(newTemp)
        } else {
          docs.tempPass = [newTemp];
        }
        docs.save(function(err) {
          if (err) {
            console.log(err);
            done('Save Fail');
          }
          done(newTemp);
        });
      } else {
        done('Login Error');
      }
    });
  };

  this.getMyNotes = (req, done) => {
    let user = req.query.user;
    let pass = req.query.tempPass;
    let permId = null;

    tempPassCheck(pass,(docs) => {

      if (docs[0]) {
        permId = docs[0].permId;

        Note.find({ createdBy: user, userId: permId }, (err, docs) => {
          if (err) {
            console.log(err);
            done('No notes');
          }
          docs = docs.map(doc => {
            return { createdBy: doc.createdBy, dataLable: doc.dataLable, heading: doc.heading, id: doc.id };
          });

          done(docs);
        });
      } else {
        done('Logout User');
      }
    });
  };

  this.getNote = (req, done) => {
    let user = req.query.user;
    let noteHeading = req.query.noteHeading;
    let pass = req.query.tempPass;
    let permId = null;

    tempPassCheck(pass,(docs) => {
      if (docs[0]) {
        permId = docs[0].permId;
        console.log('AAAAAAAAA', noteHeading);
        console.log(noteHeading);
        Note.find({ createdBy: user, userId: permId, id: noteHeading }, (err, docs) => {
          if (err) {
            console.log(err);
            done('No notes');
          }
          docs = docs.map(doc => {
            return { createdBy: doc.createdBy, dataLable: doc.dataLable, heading: doc.heading, id: doc.id };
          });

          done(docs);
        });
      } else {
        done('Logout User');
      }
    });
  };

  this.getNoteNames = (req, done) => {
    let pass = req.query.tempPass;
    let permId = null;

    tempPassCheck(pass,(docs) => {
      if (docs[0]) {
        permId = docs[0].permId;

        Note.find({ userId: permId }, (err, docs) => {
          if (err) {
            console.log(err);
            done('No notes');
          }
          let nameArray = docs.map(doc => (doc = doc.createdBy));

          let unique = nameArray.filter(onlyUnique);
          done(unique);
        });
      } else {
        done('Logout User');
      }
    });
  };

  this.updateNote = (req, done) => {
    console.log(req.query.tempPass);
    console.log(req.body.person.id);
    let updateNoteId = req.body.person.id;

    let pass = req.query.tempPass;
    let permId = null;

    tempPassCheck(pass,(docs) => {
      if (docs[0]) {
        permId = docs[0].permId;

        Note.findOne({ id: updateNoteId, userId: permId }, (err, doc) => {
          if (err) console.log(err);
          let update = req.body.person;
          doc.heading = update.heading;
          doc.dataLable = update.dataLable;
          doc.save(function(err) {
            if (err) {
              console.log(err);
              done('success');
            }
          });
        });

        done;
      }
    });
  };
};
