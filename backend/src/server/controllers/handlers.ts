import mongoose, { Model, Schema } from 'mongoose';
import config from '../config';
import { calcTimeNowOffset, formatDate, mapNoteV1ToNoteV2Query, mapNoteV2ToNoteV1 } from '../utils';

type Callback = (resp: any) => void;

export interface NoteAttrs {
  id: string;
  userId: string;
  createdBy: string;
  heading: string;
  dataLable?: any[];
}

type NoteDoc = mongoose.HydratedDocument<NoteAttrs>;

export interface NoteV2Content {
  data: string;
  date?: string;
}

export interface NoteV2Attrs {
  id: string;
  userId: string;
  parentId: string;
  type: string;
  name?: string;
  content?: NoteV2Content;
}

type NoteV2Doc = mongoose.HydratedDocument<NoteV2Attrs>;

export interface NoteUserAttrs {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  tempPass: string[];
  permId: string;
}

type NoteUserDoc = mongoose.HydratedDocument<NoteUserAttrs>;

const noteSchema = new Schema<NoteAttrs>({
  id: { type: String, required: true },
  userId: { type: String, required: true },
  createdBy: { type: String, required: true },
  heading: { type: String, required: true },
  dataLable: { type: Array },
});

const noteContent = new Schema<NoteV2Content>({
  data: { type: String, required: true },
  date: { type: String },
});

const noteV2Schema = new Schema<NoteV2Attrs>({
  id: { type: String, required: true },
  userId: { type: String, required: true },
  name: { type: String },
  parentId: { type: String, required: true },
  type: { type: String, required: true },
  content: { type: noteContent },
});

const noteUserSchema = new Schema<NoteUserAttrs>({
  email: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  password: { type: String, required: true },
  tempPass: { type: [String], required: true },
  permId: { type: String, required: true },
});

const NoteModel: Model<NoteAttrs> = mongoose.model<NoteAttrs>('Notes', noteSchema);
const NoteUserModel: Model<NoteUserAttrs> = mongoose.model<NoteUserAttrs>('NoteUsers', noteUserSchema);
const NoteV2Model: Model<NoteV2Attrs> = mongoose.model<NoteV2Attrs>('notes-v2', noteV2Schema);

const mongoUri = config.mongoUri || process.env.DB;
if (mongoUri) {
  mongoose.connect(mongoUri).catch((err) => {
    console.error('MongoDB connection error:', err);
  });
} else {
  console.warn('No MongoDB URI configured (DB or MONGODB_URI).');
}

export default class Handler {
  docId(count: number): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < count; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  private onlyUnique<T>(value: T, index: number, self: T[]): boolean {
    return self.indexOf(value) === index;
  }

  newUser = async (req: NoteUserAttrs, done: Callback) => {
    try {
      const user = { ...req };
      const docId = this.docId(10);

      user.tempPass = [docId];
      user.permId = docId;
      const createUser = new NoteUserModel(user);

      await createUser.save();
      console.log('User Created', createUser);
      done(docId);
    } catch (err: any) {
      console.log(err);
      done(err?.name ?? 'Error');
    }
  };

  private async tempPassCheck(tempPass: string, done: Callback) {
    try {
      console.log('Temp Pass Check', tempPass);
      const docs = await NoteUserModel.find({ tempPass });
      console.log('Temp Pass Confirm');
      done(docs);
    } catch (err: any) {
      console.log('Temp Pass Error', err?.name);
      done(err?.name ?? 'Error');
    }
  }

  newNote = async (req: any, done: Callback) => {
    try {
      const note = { ...req, userId: req.userId };
      const createNote = new NoteModel(note);
      await createNote.save();
      done('Created');
    } catch (err: any) {
      console.log(err);
      done(err?.name ?? 'Error');
    }
  };

  getAllNotes = async (req: any, done: Callback) => {
    try {
      const docs = await NoteModel.find({ userId: req.auth.sub });
      done(docs);
    } catch (err) {
      console.log(err);
      done('No notes');
    }
  };

  userLogin = async (req: any, done: Callback) => {
    const user = await NoteUserModel.findOne({ email: req.email, password: req.password });
    if (user && user.password === req.password) {
      const newTemp = this.docId(30);
      if (user.tempPass.length > 0) {
        if (user.tempPass.length > 1) {
          user.tempPass = user.tempPass.slice(1);
        }
        user.tempPass.push(newTemp);
      } else {
        user.tempPass = [newTemp];
      }
      try {
        await user.save();
        done(newTemp);
      } catch (err) {
        console.log(err);
        done('Save Fail');
      }
    } else {
      done('Login Error');
    }
  };

  getMyNotes = async (req: any, done: Callback) => {
    try {
      const { user } = req.query;
      const decodedUser = decodeURI(user);

      const docs = await NoteModel.find({ createdBy: decodedUser, userId: req.auth.sub });
      const trimmed = docs.map((doc) => ({
        createdBy: doc.createdBy,
        dataLable: doc.dataLable,
        heading: doc.heading,
        id: doc.id,
      }));

      done(trimmed);
    } catch (err) {
      console.log(err);
      done('No notes');
    }
  };

  getNote = async (req: any, done: Callback) => {
    try {
      const { user, noteHeading } = req.query;
      const decodedUser = decodeURI(user);
      const decodedNoteHeading = decodeURI(noteHeading);

      const docs = await NoteModel.find({ createdBy: decodedUser, userId: req.auth.sub, id: decodedNoteHeading });
      const trimmed = docs.map((doc) => ({
        createdBy: doc.createdBy,
        dataLable: doc.dataLable,
        heading: doc.heading,
        id: doc.id,
      }));
      done(trimmed);
    } catch (err) {
      console.log(err);
      done('No notes');
    }
  };

  getNoteNames = async (req: any, done: Callback) => {
    try {
      const docs = await NoteModel.find({ userId: req.auth.sub });
      const nameArray = docs.map((doc) => doc.createdBy);
      const unique = nameArray.filter(this.onlyUnique);
      done(unique);
    } catch (err) {
      console.log(err);
      done('No notes');
    }
  };

  updateNote = async (req: any, done: Callback) => {
    try {
      const updateNoteId = req.body.person.id;

      const doc = await NoteModel.findOne({ id: updateNoteId, userId: req.auth.sub });
      if (!doc) return done('No notes');

      const update = req.body.person;
      doc.heading = update.heading;
      doc.dataLable = update.dataLable;
      await doc.save();
      done('success');
    } catch (err) {
      console.log(err);
      done('No notes');
    }
  };

  updateOneNote = async (req: any, done: Callback) => {
    try {
      const updateNoteId = req.body.person.id;
      const doc = await NoteModel.findOne({ id: updateNoteId, userId: req.auth.sub });
      if (!doc) return done('Error');

      const update = req.body.person;
      if (update.heading) doc.heading = update.heading;
      if (doc.dataLable) {
        if (req.body.delete) {
          const newLable = doc.dataLable.filter((item: any) => JSON.stringify(item) !== JSON.stringify(update.dataLable));
          doc.dataLable = newLable;

          if (update.heading) {
            this.syncDeleteV2Note(req, () => {});
          }
        } else if (update.dataLable.edit) {
          const dataLable = update.dataLable;
          const docDataLable = JSON.parse(JSON.stringify(doc.dataLable));
          const ind = docDataLable.findIndex((item: any) => item.data === dataLable.data);
          if (docDataLable[ind]) {
            docDataLable[ind].data = dataLable.edit;
            doc.dataLable = docDataLable;
          }

          if (update.heading) {
            this.syncUpdateV2Note(req, () => {});
          }
        } else {
          if (update.heading) {
            this.syncCreateV2Note(req, () => {});
          }
          doc.dataLable.push(update.dataLable);
        }
      }
      await doc.save();
      done('success');
    } catch (err) {
      console.log('Error', err);
      done('fail');
    }
  };

  updateSiteLog = async (req: any, done: Callback) => {
    try {
      const sitesId = 'KdE0rnAoFwb7BaRJgaYd';
      const userId = '68988da2b947c4d46023d679';
      const doc = await NoteModel.findOne({ id: sitesId, userId });
      if (!doc || !doc.dataLable) return done('fail');

      doc.heading = 'Site Track';
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
      if (websiteName && websiteName !== '') siteTag = websiteName;
      console.log('siteTag', siteTag);
      const ipData = await fetch(`http://ip-api.com/json/${ip}?fields=country,regionName,city,timezone,org`);
      const ipDataJson = await ipData.json();

      if (ipDataJson && ipDataJson.country) {
        data += `\nCountry: ${ipDataJson.country}\nRegion: ${ipDataJson.regionName}\nCity: ${ipDataJson.city}\nTimezone: ${ipDataJson.timezone}\nOrg: ${ipDataJson.org}`;
      }
      doc.dataLable.push({ tag: siteTag, data });

      const parentId = `KdE0rnAoFwb7BaRJgaYd::${siteTag}`;
      const noteV2Id = `${parentId}::NOTE::${this.docId(10)}`;
      const note = {
        id: noteV2Id,
        parentId,
        type: 'NOTE',
        content: { data },
        userId,
      };

      const createNote = new NoteV2Model(note);
      await createNote.save();

      await doc.save();
      done('success');
    } catch (err) {
      console.log('Error', err);
      done('fail');
    }
  };

  getTranslationPractice = async (done: Callback) => {
    try {
      const docs = await NoteModel.find({ createdBy: 'Henry', userId: 'UUvFcBXO6Q', heading: 'TranslationPractice' });
      const result = docs[0].dataLable?.reduce((acc: any, { tag, data }: any) => {
        const formatted = data.trim().endsWith('.') ? `${data} ` : `${data}. `;
        acc[tag] = acc[tag] ? `${acc[tag]}${formatted}` : formatted;
        return acc;
      }, {});
      done(result ?? {});
    } catch (err) {
      console.log(err);
      done(null);
    }
  };

  getTranslationLevels = async (done: Callback) => {
    try {
      const rows = await NoteModel.aggregate([
        { $match: { createdBy: 'TranslationPractice' } },
        {
          $project: {
            heading: 1,
            tags: { $setUnion: ['$dataLable.tag', []] },
          },
        },
        { $sort: { _id: 1 } },
      ]);
      const result = Object.fromEntries(rows.map(({ heading, tags }: any) => [heading, tags]));
      done(result);
    } catch (err) {
      console.log(err);
      done(null);
    }
  };

  getFullTranslationPractice = async (done: Callback) => {
    try {
      const docs = await NoteModel.find({ createdBy: 'TranslationPractice' });
      const result = docs.reduce((acc: any, { heading, dataLable }: any) => {
        const nested = dataLable.reduce((noteAcc: any, { tag, data }: any) => {
          const formatted = data.trim().endsWith('.') ? `${data} ` : `${data}. `;
          noteAcc[tag] = noteAcc[tag] ? `${noteAcc[tag]}${formatted}` : formatted;
          return noteAcc;
        }, {});

        acc[heading] = nested;
        return acc;
      }, {});

      done(result);
    } catch (err) {
      console.log(err);
      done(null);
    }
  };

  private splitSentences = (input: string) =>
    input
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

  getSavedTranslation = async (req: any, done: Callback) => {
    try {
      const level = req?.query?.level;
      const subLevel = req?.query?.subLevel;
      if (!level || !subLevel) {
        done(null);
        return;
      }

      const docs = await NoteModel.find({ createdBy: 'TranslationPractice', heading: level });
      if (docs.length < 1) {
        done(null);
        return;
      }

      const filteredDocs = docs[0].dataLable?.filter((item: any) => item.tag.trim() === subLevel) ?? [];

      if (filteredDocs.length === 0) {
        done(null);
        return;
      }

      const english = this.splitSentences(filteredDocs[0].data);
      const german = filteredDocs.length > 1 ? this.splitSentences(filteredDocs[1].data) : [];
      const englishSentences = english.map((sentence, index) => ({
        sentence,
        translation: german[index] || '',
      }));

      done(englishSentences);
    } catch (err) {
      console.log(err);
      done(null);
    }
  };

  getNoteV2Content = async (req: any, done: Callback) => {
    try {
      const userId = req?.auth?.sub;
      const docs = await NoteV2Model.find({ userId, parentId: req.query.parentId ?? '' });
      done(docs);
    } catch (err) {
      console.log(err);
      done('No notes');
    }
  };

  newV2Note = async (req: any, done: Callback) => {
    try {
      const userId = req.auth.sub;
      const { id, parentId, type, content, name } = req.body;

      const existing = await NoteV2Model.findOne({ userId, id });
      if (existing) {
        console.log('Note with this id already Created!');
        done(existing);
        return;
      }

      const note: any = {
        id,
        parentId,
        type,
        content,
        userId,
      };
      if (name) note.name = name;
      const createNote = new NoteV2Model(note);

      const data = await createNote.save();
      done(data);
    } catch (err: any) {
      console.log(err);
      done(err?.name ?? 'Error');
    }
  };

  updateV2Note = async (req: any, done: Callback) => {
    try {
      const userId = req.auth.sub;
      const { id, parentId, content, name } = req.body;

      const doc = await NoteV2Model.findOne({ id, userId });
      if (!doc) {
        done(`Error no note id: ${id}`);
        return;
      }
      if (parentId) doc.parentId = parentId;
      if (content) doc.content = content;
      if (name) doc.name = name;
      const data = await doc.save();
      done(data);
    } catch (err) {
      console.log(err);
      done('Error');
    }
  };

  deleteV2Note = async (req: any, done: Callback) => {
    try {
      const userId = req.auth.sub;
      const { id } = req.body;
      const data = await NoteV2Model.deleteOne({ id, userId });
      done(data);
    } catch (err) {
      console.log(err);
      done('Error');
    }
  };

  syncUpdateV2Note = async (req: any, done: Callback) => {
    try {
      const { queryParams, newContent, parentId } = mapNoteV1ToNoteV2Query(req);

      const doc = await NoteV2Model.findOne(queryParams);
      if (!doc) {
        done('Error note not found');
        return;
      }
      if (!parentId) {
        done('Error no note id');
        return;
      }
      if (parentId) doc.parentId = parentId;
      if (newContent?.data) {
        doc.content = { ...(doc.content ?? {}), data: newContent.data, date: newContent.date };
      }
      const data = await doc.save();
      done(data);
    } catch (err) {
      console.log(err);
      done('Error');
    }
  };

  syncCreateV2Note = async (req: any, done: Callback) => {
    const body = req.body;
    const person = body.person;
    const isNote = !person.dataLable.data.includes('"json":true');
    let parentId = `${person.id}::${person.dataLable.tag}`;
    const jsonDataLableData = !isNote ? JSON.parse(person.dataLable.data) : undefined;
    const content = isNote
      ? { data: person.dataLable.data }
      : { data: jsonDataLableData.data, date: jsonDataLableData.date };

    if (!isNote) {
      const userId = req.auth.sub;

      const logDirCreate = { id: `${person.id}::Log`, userId, parentId: person.id, type: 'FOLDER', name: 'Log' };
      const logDirCreateReq = { ...req, body: logDirCreate };

      this.newV2Note(logDirCreateReq, () => {
        console.log('Log Dir created');

        const logDay = jsonDataLableData?.date ? formatDate(jsonDataLableData.date.substring(0, 16).trim()) : 'unknown';
        const logDayId = `${logDirCreate.id}::${logDay}`.trim().replaceAll(' ', '-');
        const logDayCreate = { id: logDayId, userId, parentId: logDirCreate.id, type: 'FOLDER', name: logDay };
        const logDayCreateReq = { ...req, body: logDayCreate };

        this.newV2Note(logDayCreateReq, () => {
          console.log('Log Day Created');
          const newReq = { ...req };
          const id = this.docId(10);
          newReq.body = {
            id: `${parentId}::LOG::${id}`,
            userId,
            parentId,
            // parentId: logDayCreate.id,
            type: 'LOG',
            content,
          };

          this.newV2Note(newReq, (data) => {
            console.log('Log Created');
            done(data);
          });
        });
      });
    } else {
      const type = isNote ? 'NOTE' : 'LOG';
      const newReq = { ...req };
      const id = this.docId(10);
      newReq.body = { id, parentId, type, content };
      this.newV2Note(newReq, (data) => {
        console.log('data', data);
        done(data);
      });
    }
  };

  syncDeleteV2Note = async (req: any, done: Callback) => {
    try {
      const { queryParams } = mapNoteV1ToNoteV2Query(req);

      const doc = await NoteV2Model.findOne(queryParams);
      if (!doc) {
        done('Error note not found');
        return;
      }
      const newReq = { ...req, body: { id: doc.id } };
      await this.deleteV2Note(newReq, () => {});
      done('Deleted');
    } catch (err) {
      console.log('Error', err);
      done('fail');
    }
  };

  syncCreateV1Note = (req: any, done: Callback) => {
    const mapped = mapNoteV2ToNoteV1(req.body);
    const syncReq = { ...req, body: mapped };

    this.updateOneNote(syncReq, () => {
      console.log('Created Note V1');
      done('ok');
    });
  };

  syncUpdateV1Note = async (req: any, done: Callback) => {
    try {
      const userId = req.auth.sub;
      const doc = await NoteV2Model.findOne({ id: req.body.id, userId });
      if (!doc) {
        done('No Note found');
        return;
      }
      const edit = doc.content?.date
        ? JSON.stringify({ json: true, date: doc.content?.date, data: doc.content.data })
        : doc.content?.data;
      const data = { ...req.body, edit };
      const mapped = mapNoteV2ToNoteV1(data);
      const syncReq = { ...req, body: mapped };

      this.updateOneNote(syncReq, (resp) => {
        console.log('Created Note V1');
        done(resp);
      });
    } catch (err) {
      console.log('Error', err);
      done('Error');
    }
  };

  syncDeleteV1Note = async (req: any, done: Callback) => {
    try {
      const userId = req.auth.sub;
      const doc = await NoteV2Model.findOne({ id: req.body.id, userId });
      if (!doc) {
        done('No Note found');
        return;
      }
      const data = { ...req.body };
      const mapped = mapNoteV2ToNoteV1(data);
      const syncReq = { ...req, body: { ...mapped, delete: true } };

      this.updateOneNote(syncReq, (resp) => {
        done(resp);
      });
    } catch (err) {
      console.log('Error', err);
      done('Error');
    }
  };
}
