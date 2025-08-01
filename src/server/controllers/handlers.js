/* eslint-disable no-plusplus */
/* eslint-disable no-return-assign */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-param-reassign */
/* eslint-disable func-names */
const fetch = require("node-fetch");
const calcTimeNowOffset = require('../utils.js');
require('dotenv').config();

const mongoose = require('mongoose');
mongoose.connect(process.env.DB, { useNewUrlParser: true, useUnifiedTopology:true }).catch((err) => {
  console.error('MongoDB connection error:', err);
});

const { Schema } = mongoose;

const noteSchema = new Schema({
  id: { type: String, required: true },
  userId: { type: String, required: true },
  createdBy: { type: String, required: true },
  heading: { type: String, required: true },
  dataLable: { type: Array }
});

const noteUserSchema = new Schema({
  email: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  password: { type: String, required: true },
  tempPass: { type: Array, required: true },
  permId: { type: String, required: true }
});

const Note = mongoose.model('Notes', noteSchema);
const NoteUser = mongoose.model('NoteUsers', noteUserSchema);

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


    createUser.save((err, data) => {
      if (err) {
        console.log(err);
        done(err.name);
      } else {
        console.log('User Created', data);
      }
    });
    done(docId);
  };

  function tempPassCheck(tempPass, done) {
    console.log('Temp Pass Check', tempPass);
    NoteUser.find({ tempPass }, (err, docs) => {
      if (err) {
        console.log('Temp Pass Error', err.name);
        done(err.name);
      } else {
        console.log('Temp Pass Confirm');
        done(docs);
      }
    });
  }

  this.newNote = (req, done) => {
    const note = req;
    const pass = req.userId;

    tempPassCheck(pass, (docPass) => {
      if (docPass[0]) {
        note.userId = docPass[0].permId;

        const createNote = new Note(note);

        createNote.save((err, data) => {
          if (err) {
            console.log(err);
            done(err.name);
          } else {
            console.log(data);
            done('Created');
          }
        });
      } else {
        done('Temp Pass fail');
      }
    });
  };

  this.getAllNotes = (req, done) => {
    const pass = req.query.tempPass;
    let permId = null;

    tempPassCheck(pass, (docPass) => {
      if (docPass[0]) {
        permId = docPass[0].permId;

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
    NoteUser.findOne({ email: req.email, password: req.password }, (err, docs) => {
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
        docs.save((error) => {
          if (error) {
            console.log(error);
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
    const { user } = req.query;
    const decodedUser = decodeURI(user)
    console.log("Trying to getMyNotes", decodedUser)
    const pass = req.query.tempPass;
    let permId = null;

    tempPassCheck(pass, (docPass) => {
      if (docPass[0]) {
        permId = docPass[0].permId;
        console.log('Finding notes created by:', decodedUser);
        Note.find({ createdBy: decodedUser, userId: permId }, (err, docs) => {
          console.log('Notes Found', docs.length);
          if (err) {
            console.log(err);
            done('No notes');
          }
          docs = docs.map(doc => ({
            createdBy: doc.createdBy, dataLable: doc.dataLable, heading: doc.heading, id: doc.id
          }));

          done(docs);
        });
      } else {
        done('Logout User');
      }
    });
  };

  this.getNote = (req, done) => {
    const { user, noteHeading } = req.query;
    const decodedUser = decodeURI(user)
    const decodedNoteHeading = decodeURI(noteHeading)
    const pass = req.query.tempPass;
    let permId = null;

    tempPassCheck(pass, (docPass) => {
      if (docPass[0]) {
        permId = docPass[0].permId;
        console.log('Note Heading:', decodedNoteHeading);
        Note.find({ createdBy: decodedUser, userId: permId, id: decodedNoteHeading }, (err, docs) => {
          if (err) {
            console.log(err);
            done('No notes');
          }
          docs = docs.map(doc => ({
            createdBy: doc.createdBy, dataLable: doc.dataLable, heading: doc.heading, id: doc.id
          }));

          done(docs);
        });
      } else {
        done('Logout User');
      }
    });
  };

  this.getNoteNames = (req, done) => {
    const pass = req.query.tempPass;
    let permId = null;

    tempPassCheck(pass, (docPass) => {
      if (docPass[0]) {
        permId = docPass[0].permId;

        Note.find({ userId: permId }, (err, docs) => {
          if (err) {
            console.log(err);
            done('No notes');
          }
          const nameArray = docs.map(doc => (doc = doc.createdBy));

          const unique = nameArray.filter(onlyUnique);
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
    const updateNoteId = req.body.person.id;

    const pass = req.query.tempPass;
    let permId = null;

    tempPassCheck(pass, (docPass) => {
      if (docPass[0]) {
        permId = docPass[0].permId;

        Note.findOne({ id: updateNoteId, userId: permId }, (err, doc) => {
          if (err) {
            console.log(err);
            done('Error', err);
          } else {
            const update = req.body.person;
            doc.heading = update.heading;
            doc.dataLable = update.dataLable;
            doc.save((error) => {
              if (error) {
                console.log(error);
                done('success');
              }
            });
          }
        });
      }
    });
  };
  this.updateOneNote = (req, done) => {
    const updateNoteId = req.body.person.id;

    const pass = req.query.tempPass;
    let permId = null;

    tempPassCheck(pass, (docPass) => {
      if (docPass[0]) {
        permId = docPass[0].permId;

        Note.findOne({ id: updateNoteId, userId: permId }, (err, doc) => {
          if (err) {
            console.log(err);
          } else {
            const update = req.body.person;
            doc.heading = update.heading;
            if (doc.dataLable) {
              if (req.body.delete) {
                const newLable = doc.dataLable
                  .filter(item => JSON.stringify(item) !== JSON.stringify(update.dataLable));
                doc.dataLable = newLable;
              } else if (update.dataLable.edit) {
                const dataLable = update.dataLable;
                const docDataLable = JSON.parse(JSON.stringify(doc.dataLable));
                const ind = docDataLable.findIndex(item => item.data === dataLable.data);
                if(docDataLable[ind]){
                  docDataLable[ind].data = dataLable.edit;
                  doc.dataLable = docDataLable;
                }
              } else {
                doc.dataLable.push(update.dataLable);
              }
            }
            doc.save((error) => {
              if (error) {
                console.log('Error', error);
                done('fail');
              } else {
                done('success');
              }
            });
          }
        });
      }
    });
  };
  this.updateSiteLog = (req, done) => {
    const sitesId = 'KdE0rnAoFwb7BaRJgaYd';
    const userId = 'UUvFcBXO6Q';
    Note.findOne({ id: sitesId, userId }, async (err, doc) => {
      if (err) {
        console.log(err);
      } else {
        doc.heading = 'Site Track';
        console.log('userId',userId);
        if (doc.dataLable) {
            const referer = req.headers.referer; 
            const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            let data = `Referer: ${referer}\nIp: ${ip}\n SA Date: ${calcTimeNowOffset('+2')}\n https://ipapi.co/${ip}/`;
            let siteTag = 'Site one';
            if(referer){
              let siteName = referer.replace('http://','').replace('https://','')+"";
              if(siteName){
                siteTag = siteName.substring(0, siteName.indexOf('/'));
              }
            }
            const websiteName  = req.query && req.query.site ? req.query.site: '';
            if (websiteName && websiteName != '') siteTag = websiteName;
            console.log('siteTag',siteTag);
            const ipData = await fetch(`http://ip-api.com/json/${ip}?fields=country,regionName,city,timezone,org`);
            const ipDataJson = await ipData.json();

            if (ipDataJson && ipDataJson.country) {
              data+= `\nCountry: ${ipDataJson.country}\nRegion: ${ipDataJson.regionName}\nCity: ${ipDataJson.city}\nTimezone: ${ipDataJson.timezone}\nOrg: ${ipDataJson.org}`;
            }
            doc.dataLable.push({ tag: siteTag, data });
        }
        doc.save((error) => {
          if (error) {
            console.log('Error', error);
            done('fail');
          } else {
            done('success');
          }
        });
      }
    });
  };

  this.getTranslationPractice = (done) => {
    Note.find({ createdBy: "Henry", userId: "UUvFcBXO6Q", heading: "TranslationPractice" }, (err, docs) => {
      if (err) {
        console.log(err);
        done(null);
      }

      const result = docs[0].dataLable.reduce((acc, { tag, data }) => {
        const formatted = data.trim().endsWith(".")? `${data} `: `${data}. `;
        acc[tag] = acc[tag] ? `${acc[tag]}${formatted}`: formatted;

        return acc;
      }, {});

      done(result);
    });
  }

  this.getFullTranslationPractice = (done) => {
  
    Note.find({ createdBy: "TranslationPractice" }, (err, docs) => {
      if (err) {
        console.log(err);
        done(null);
      }

      const result = docs.reduce((acc, {heading, dataLable}) => {
        const result = dataLable.reduce((noteAcc, { tag, data }) => {
          const formatted = data.trim().endsWith(".")? `${data} `: `${data}. `;
          noteAcc[tag] = noteAcc[tag] ? `${noteAcc[tag]}${formatted}`: formatted;
          return noteAcc;
        }, {});

        acc[heading] = result
        return acc
      }, {});
      
      done(result);
    });
  }

  const splitSentences = (input) =>
    input
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

  this.getSavedTranslation = (req, done) => {
    const level  =  req?.query?.level;
    const subLevel  =  req?.query?.subLevel;
    if (!level || !subLevel){
      done(null);
      return;
    }

    Note.find({ createdBy: "TranslationPractice", heading: level }, (err, docs) => {
      if (err) {
        console.log(err);
        done(null);
        return;
      }

      if(docs.length < 1){
        done(null);
        return;
      }

      const filteredDocs = docs[0].dataLable.filter(item => item.tag.trim() === subLevel);

      if (filteredDocs.length === 0){
        done(null);
        return;
      }

      const english = splitSentences(filteredDocs[0].data);
      const german = filteredDocs.length > 1 ? splitSentences(filteredDocs[1].data): [];
      const englishSentences = english.map((sentence, index) => ({
        sentence,
        translation: german[index] || ''
      }));

      done(englishSentences);
    });
  };
};
