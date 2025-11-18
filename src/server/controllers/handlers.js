/* eslint-disable no-plusplus */
/* eslint-disable no-return-assign */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-param-reassign */
/* eslint-disable func-names */
const fetch = require('node-fetch');
const calcTimeNowOffset = require('../utils.js');
require('dotenv').config();

const mongoose = require('mongoose');
mongoose.connect(process.env.DB).catch((err) => {
  console.error('MongoDB connection error:', err);
});

const { Schema } = mongoose;

const noteSchema = new Schema({
  id: { type: String, required: true },
  userId: { type: String, required: true },
  createdBy: { type: String, required: true },
  heading: { type: String, required: true },
  dataLable: { type: Array },
});

const noteContent = new mongoose.Schema({
  data: { type: String, required: true },
  date: { type: String},
});

const noteV2Schema = new Schema({
  id: { type: String, required: true },
  userId: { type: String, required: true },
  name: { type: String },
  parentId: { type: String, required: true },
  type: { type: String, required: true },
  content: { type: noteContent },
});

const noteUserSchema = new Schema({
  email: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  password: { type: String, required: true },
  tempPass: { type: Array, required: true },
  permId: { type: String, required: true },
});

const Note = mongoose.model('Notes', noteSchema);
const NoteUser = mongoose.model('NoteUsers', noteUserSchema);
const NoteV2 = mongoose.model('notes-v2', noteV2Schema);

function formatDate(input) {
  const date = new Date(input);

  if (isNaN(date.getTime())) {
    throw new Error("Invalid date format");
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  const weekday = input.slice(0, 3);

  return `${year}/${month}/${day} ${weekday}`;
}

module.exports = function () {
  this.docId = (count) => {
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
    const user = req;
    const docId = this.docId(10);

    user.tempPass = [docId];
    user.permId = docId;
    const createUser = new NoteUser(user);

    createUser
      .save()
      .then((data) => {
        console.log('User Created', data);
      })
      .catch((err) => {
        console.log(err);
        done(err.name);
      });
    done(docId);
  };

  function tempPassCheck(tempPass, done) {
    console.log('Temp Pass Check', tempPass);
    NoteUser.find({ tempPass })
      .then((docs) => {
        console.log('Temp Pass Confirm');
        done(docs);
      })
      .catch((err) => {
        console.log('Temp Pass Error', err.name);
        done(err.name);
      });
  }

  this.newNote = (req, done) => {
    const note = req;
    note.userId = req.userId;
    const createNote = new Note(note);

    createNote
      .save()
      .then((data) => {
        console.log(data);
        done('Created');
      })
      .catch((err) => {
        console.log(err);
        done(err.name);
      });
  };

  this.getAllNotes = (req, done) => {
    Note.find({ userId: req.auth.sub })
      .then((docs) => {
        done(docs);
      })
      .catch((err) => {
        console.log(err);
        done('No notes');
      });
  };

  this.userLogin = (req, done) => {
    NoteUser.findOne({ email: req.email, password: req.password }).then((docs) => {
      if (docs && docs.password === req.password) {
        const newTemp = this.docId(30);
        if (docs.tempPass.length > 0) {
          if (docs.tempPass.length > 1) {
            docs.tempPass = docs.tempPass.slice(1);
          }
          docs.tempPass.push(newTemp);
        } else {
          docs.tempPass = [newTemp];
        }
        docs
          .save()
          .then((data) => {
            done(newTemp);
          })
          .catch((err) => {
            console.log(err);
            done('Save Fail');
          });
      } else {
        done('Login Error');
      }
    });
  };

  this.getMyNotes = (req, done) => {
    const { user } = req.query;
    const decodedUser = decodeURI(user);
    console.log('Trying to getMyNotes', decodedUser);

    console.log('Finding notes created by:', decodedUser);

    Note.find({ createdBy: decodedUser, userId: req.auth.sub })
      .then((docs) => {
        console.log('Notes Found', docs.length);
        docs = docs.map((doc) => ({
          createdBy: doc.createdBy,
          dataLable: doc.dataLable,
          heading: doc.heading,
          id: doc.id,
        }));

        done(docs);
      })
      .catch((err) => {
        console.log(err);
        done('No notes');
      });
  };

  this.getNote = (req, done) => {
    const { user, noteHeading } = req.query;
    const decodedUser = decodeURI(user);
    const decodedNoteHeading = decodeURI(noteHeading);

    console.log('Note Heading:', decodedNoteHeading);
    Note.find({ createdBy: decodedUser, userId: req.auth.sub, id: decodedNoteHeading })
      .then((docs) => {
        docs = docs.map((doc) => ({
          createdBy: doc.createdBy,
          dataLable: doc.dataLable,
          heading: doc.heading,
          id: doc.id,
        }));

        done(docs);
      })
      .catch((err) => {
        console.log(err);
        done('No notes');
      });
  };

  this.getNoteNames = (req, done) => {
    Note.find({ userId: req.auth.sub })
      .then((docs) => {
        const nameArray = docs.map((doc) => (doc = doc.createdBy));

        const unique = nameArray.filter(onlyUnique);
        done(unique);
      })
      .catch((err) => {
        console.log(err);
        done('No notes');
      });
  };

  this.updateNote = (req, done) => {
    const updateNoteId = req.body.person.id;

    Note.findOne({ id: updateNoteId, userId: req.auth.sub })
      .then((doc) => {
        const update = req.body.person;
        doc.heading = update.heading;
        doc.dataLable = update.dataLable;
        doc
          .save()
          .then((data) => {
            done('success');
          })
          .catch((err) => {
            console.log(err);
            done('No notes');
          });
      })
      .catch((err) => {
        console.log(err);
        done('Error', err);
      });
  };
  this.updateOneNote = (req, done) => {
    const updateNoteId = req.body.person.id;

    Note.findOne({ id: updateNoteId, userId: req.auth.sub })
      .then((doc) => {
        const update = req.body.person;
        doc.heading = update.heading;
        if (doc.dataLable) {
          if (req.body.delete) {
            const newLable = doc.dataLable.filter((item) => JSON.stringify(item) !== JSON.stringify(update.dataLable));
            doc.dataLable = newLable;
          } else if (update.dataLable.edit) {
            const dataLable = update.dataLable;
            const docDataLable = JSON.parse(JSON.stringify(doc.dataLable));
            const ind = docDataLable.findIndex((item) => item.data === dataLable.data);
            if (docDataLable[ind]) {
              docDataLable[ind].data = dataLable.edit;
              doc.dataLable = docDataLable;
            }

            this.syncUpdateV2Note(req, () => {
              console.log('Partial Syncd');
            })
          } else {
            this.syncCreateV2Note(req, () => {
              console.log('Create note Syncd');
            })
            doc.dataLable.push(update.dataLable);
          }
        }
        doc
          .save()
          .then((data) => {
            done('success');
          })
          .catch((err) => {
            console.log('Error', err);
            done('fail');
          });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  this.updateSiteLog = (req, done) => {
    const sitesId = 'KdE0rnAoFwb7BaRJgaYd';
    const userId = '68988da2b947c4d46023d679';
    Note.findOne({ id: sitesId, userId })
      .then(async (doc) => {
        doc.heading = 'Site Track';
        console.log('userId', userId);
        if (doc.dataLable) {
          const referer = req.headers.referer;
          const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
          let data = `Referer: ${referer}\nIp: ${ip}\n SA Date: ${calcTimeNowOffset('+2')}\n https://ipapi.co/${ip}/`;
          let siteTag = 'Site one';
          if (referer) {
            let siteName = referer.replace('http://', '').replace('https://', '') + '';
            if (siteName) {
              siteTag = siteName.substring(0, siteName.indexOf('/'));
            }
          }
          const websiteName = req.query && req.query.site ? req.query.site : '';
          if (websiteName && websiteName != '') siteTag = websiteName;
          console.log('siteTag', siteTag);
          const ipData = await fetch(`http://ip-api.com/json/${ip}?fields=country,regionName,city,timezone,org`);
          const ipDataJson = await ipData.json();

          if (ipDataJson && ipDataJson.country) {
            data += `\nCountry: ${ipDataJson.country}\nRegion: ${ipDataJson.regionName}\nCity: ${ipDataJson.city}\nTimezone: ${ipDataJson.timezone}\nOrg: ${ipDataJson.org}`;
          }
          doc.dataLable.push({ tag: siteTag, data });
        }
        doc
          .save()
          .then((data) => {
            done('success');
          })
          .catch((err) => {
            console.log('Error', err);
            done('fail');
          });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  this.getTranslationPractice = (done) => {
    Note.find({ createdBy: 'Henry', userId: 'UUvFcBXO6Q', heading: 'TranslationPractice' })
      .then((docs) => {
        const result = docs[0].dataLable.reduce((acc, { tag, data }) => {
          const formatted = data.trim().endsWith('.') ? `${data} ` : `${data}. `;
          acc[tag] = acc[tag] ? `${acc[tag]}${formatted}` : formatted;

          return acc;
        }, {});

        done(result);
      })
      .catch((err) => {
        console.log(err);
        done(null);
      });
  };

  this.getTranslationLevels = (done) => {
    Note.aggregate([
      { $match: { createdBy: 'TranslationPractice' } },
      { 
        $project: { 
          heading: 1,
          tags: { $setUnion: ['$dataLable.tag', []] }
        }
      },
      { $sort: { _id: 1 } }
    ]).then((rows) => {
      const result = Object.fromEntries(rows.map(({ heading, tags }) => [heading, tags]));
      done(result);
    })
    .catch((err) => {
      console.log(err);
      done(null);
    });
  };

  this.getFullTranslationPractice = (done) => {
    Note.find({ createdBy: 'TranslationPractice' })
      .then((docs) => {
        const result = docs.reduce((acc, { heading, dataLable }) => {
          const result = dataLable.reduce((noteAcc, { tag, data }) => {
            const formatted = data.trim().endsWith('.') ? `${data} ` : `${data}. `;
            noteAcc[tag] = noteAcc[tag] ? `${noteAcc[tag]}${formatted}` : formatted;
            return noteAcc;
          }, {});

          acc[heading] = result;
          return acc;
        }, {});

        done(result);
      })
      .catch((err) => {
        console.log(err);
        done(null);
      });
  };

  const splitSentences = (input) =>
    input
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

  this.getSavedTranslation = (req, done) => {
    const level = req?.query?.level;
    const subLevel = req?.query?.subLevel;
    if (!level || !subLevel) {
      done(null);
      return;
    }

    Note.find({ createdBy: 'TranslationPractice', heading: level })
      .then((docs) => {
        if (docs.length < 1) {
          done(null);
          return;
        }

        const filteredDocs = docs[0].dataLable.filter((item) => item.tag.trim() === subLevel);

        if (filteredDocs.length === 0) {
          done(null);
          return;
        }

        const english = splitSentences(filteredDocs[0].data);
        const german = filteredDocs.length > 1 ? splitSentences(filteredDocs[1].data) : [];
        const englishSentences = english.map((sentence, index) => ({
          sentence,
          translation: german[index] || '',
        }));

        done(englishSentences);
      })
      .catch((err) => {
        console.log(err);
        done(null);
      });
  };

  this.getNoteV2Content = (req, done) => {
    const userId = req.auth.sub;
    NoteV2.find({ userId: userId,  parentId: req.query.parentId?? ""})
      .then((docs) => {
        done(docs);
      })
      .catch((err) => {
        console.log(err);
        done('No notes');
      });
  };

  this.newV2Note = (req, done) => {
    const userId = req.auth.sub;
    const {id, parentId, type, content, name} = req.body;

    NoteV2.findOne({ userId: userId,  id: id})
      .then((doc) => {
        if(doc){
          console.log('Note with this id already Created!');
          done(doc)
          return;
        }

        const note = {
          id, parentId, type, content, userId
        }
        if(name) note["name"] = name;
        const createNote = new NoteV2(note);

        createNote
          .save()
          .then((data) => {
            done(data);
          })
          .catch((err) => {
            console.log(err);
            done(err.name);
          });
      })
      .catch((err) => {
        console.log(err);
        done('No notes');
      });
  };

  this.updateV2Note = (req, done) => {
    const userId = req.auth.sub;
    const {id, parentId, content, name} = req.body;

    NoteV2.findOne({ id: id, userId: userId })
      .then((doc) => {
        if(!parentId){
          done('Error no note id:',id);
          return
        }
        if(parentId) doc.parentId = parentId;
        if(content) doc.content = content;
        if(name) doc.name = name;
        doc
          .save()
          .then((data) => {
            done(data);
          })
          .catch((err) => {
            console.log(err);
            done('Error', err);
          });
      })
      .catch((err) => {
        console.log(err);
        done('Error', err);
      });
  };

  this.deleteV2Note = ((req, done) => {
    const userId = req.auth.sub;
    const {id} = req.body;
    NoteV2.deleteOne({ id: id, userId: userId }).then((data) => {
      done(data);
    }).catch((err) => {
        console.log(err);
        done('Error', err);
      });
    });

  this.syncUpdateV2Note = (req, done) => {
    const body = req.body;
    const userId = req.auth.sub;
    const person = body.person
    const isNote = !person.dataLable.data.includes('"json":true')

    const parentId = person.id + "::" + person.dataLable.tag;
    const jsonDataLableEdit = !isNote? JSON.parse(person.dataLable.edit): undefined;
    const content = isNote? {data: person.dataLable.edit}: {data: jsonDataLableEdit.data, date: jsonDataLableEdit.date}
    const partialId = parentId + "::" + (isNote? "NOTE::": "LOG::");
    NoteV2.findOne({ id: { $regex: new RegExp("^" + partialId) }, parentId: parentId, userId: userId, "content.data": person.dataLable.data })
      .then((doc) => {
        if(!doc){
          done('Error note not found');
          return
        }
        if(!parentId){
          done('Error no note id:',id);
          return
        }
        if(parentId) doc.parentId = parentId;
        if(content) doc.content = content;
        doc
          .save()
          .then((data) => {
            done(data);
          })
          .catch((err) => {
            console.log(err);
            done('Error', err);
          });
      })
      .catch((err) => {
        console.log(err);
        done('Error', err);
      });
  }

  this.syncCreateV2Note = (req, done) => {
    const body = req.body;
    const person = body.person
    const isNote = !person.dataLable.data.includes('"json":true')
    let parentId = person.id + "::" + person.dataLable.tag;
    const jsonDataLableData= !isNote? JSON.parse(person.dataLable.data): undefined;
    const content = isNote? {data: person.dataLable.data}: {data: jsonDataLableData.data, date: jsonDataLableData.date}

    if(!isNote){
      const userId = req.auth.sub;

      const logDirCreate = {id: (person.id+"::Log"), userId, parentId: person.id, type: "FOLDER", name: "Log"}
      const logDirCreateReq = {...req}
      logDirCreateReq.body = logDirCreate

      this.newV2Note(logDirCreateReq, (data) => {
        console.log('Log Dir created');

        const logDay = jsonDataLableData.date ? formatDate(jsonDataLableData.date.substring(0, 16).trim()) : "unknown";
        const logDayId = (logDirCreate.id + "::" + logDay).trim().replaceAll(" ", "-");
        const logDayCreate = {id: logDayId, userId, parentId: logDirCreate.id, type: "FOLDER", name: logDay}
        const logDayCreateReq = {...req}
        logDayCreateReq.body = logDayCreate

        this.newV2Note(logDayCreateReq, (data) => {
          console.log('Log Day Created');
          const newReq = {...req}
          const id = this.docId(10);
          newReq.body = {id: (parentId+"::LOG::" + id), userId, parentId: logDayCreate.id, type: "LOG", content}

          this.newV2Note(newReq, (data) => {
            console.log('Log Created');
            done(data)
          })
        })
      })
    } else {
      const type = isNote? "NOTE": "LOG"
      const newReq = {...req}
      const id = this.docId(10);
      newReq.body = {id, parentId, type, content}
      this.newV2Note(newReq, (data) => {
        console.log('data',data);
        done(data)
      })
    }
  }
};
