import mongoose, { Model, Schema } from 'mongoose';
import config from '../config';
import {
  calcTimeNowOffset,
  formatDate,
  mapNoteV1ToNoteV2Query,
  mapNoteV2ToNoteV1,
} from '../utils';
import type {
  AuthenticatedRequest,
  Callback,
  DeleteV2NoteBody,
  NewNotePayload,
  NewV2NoteBody,
  NoteAttrs,
  NoteDataLabel,
  NoteItemMap,
  NoteQuery,
  NoteUserAttrs,
  NoteV2Content,
  NoteV2Attrs,
  QueryRequest,
  SavedTranslationQuery,
  SiteLogQuery,
  UpdateNoteBody,
  UpdateOneNoteBody,
  UpdateV2NoteBody,
  UserLoginPayload,
  UserQuery,
  V2ParentQuery,
} from '../types/handlers';

const getErrorName = (err: unknown): string | undefined => {
  if (err instanceof Error) return err.name;
  if (typeof err === 'object' && err && 'name' in err) {
    const name = (err as { name?: unknown }).name;
    return typeof name === 'string' ? name : undefined;
  }
  return undefined;
};


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
  parentId: { type: String },
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

const NoteModel: Model<NoteAttrs> = mongoose.model<NoteAttrs>(
  'Notes',
  noteSchema,
);
const NoteUserModel: Model<NoteUserAttrs> = mongoose.model<NoteUserAttrs>(
  'NoteUsers',
  noteUserSchema,
);
const NoteV2Model: Model<NoteV2Attrs> = mongoose.model<NoteV2Attrs>(
  'notes-v2',
  noteV2Schema,
);

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
    const possible =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
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
    } catch (err: unknown) {
      console.log(err);
      done(getErrorName(err) ?? 'Error');
    }
  };

  private async tempPassCheck(tempPass: string, done: Callback) {
    try {
      console.log('Temp Pass Check', tempPass);
      const docs = await NoteUserModel.find({ tempPass });
      console.log('Temp Pass Confirm');
      done(docs);
    } catch (err: unknown) {
      console.log('Temp Pass Error', getErrorName(err));
      done(getErrorName(err) ?? 'Error');
    }
  }

  newNote = async (req: NewNotePayload, done: Callback) => {
    try {
      const note = { ...req, userId: req.userId };
      const createNote = new NoteModel(note);
      await createNote.save();
      done('Created');
    } catch (err: unknown) {
      console.log(err);
      done(getErrorName(err) ?? 'Error');
    }
  };

  getAllNotes = async (req: AuthenticatedRequest, done: Callback) => {
    try {
      const docs = await NoteModel.find({ userId: req.auth.sub });
      done(docs);
    } catch (err) {
      console.log(err);
      done('No notes');
    }
  };

  userLogin = async (req: UserLoginPayload, done: Callback) => {
    const user = await NoteUserModel.findOne({
      email: req.email,
      password: req.password,
    });
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

  getMyNotes = async (
    req: AuthenticatedRequest<unknown, UserQuery>,
    done: Callback,
  ) => {
    try {
      const { user } = req.query;
      const decodedUser = decodeURI(user);

      const docs = await NoteModel.find({
        createdBy: decodedUser,
        userId: req.auth.sub,
      });
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

  getNote = async (
    req: AuthenticatedRequest<unknown, NoteQuery>,
    done: Callback,
  ) => {
    try {
      const { user, noteHeading } = req.query;
      const decodedUser = decodeURI(user);
      const decodedNoteHeading = decodeURI(noteHeading);

      const docs = await NoteModel.find({
        createdBy: decodedUser,
        userId: req.auth.sub,
        id: decodedNoteHeading,
      });
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

  getNoteNames = async (req: AuthenticatedRequest, done: Callback) => {
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

  updateNote = async (
    req: AuthenticatedRequest<UpdateNoteBody>,
    done: Callback,
  ) => {
    try {
      const updateNoteId = req.body.person.id;

      const doc = await NoteModel.findOne({
        id: updateNoteId,
        userId: req.auth.sub,
      });
      if (!doc) return done('No notes');

      const update = req.body.person;
      doc.heading = update.heading ?? 'Placeholder Heading';
      doc.dataLable = update.dataLable;
      await doc.save();
      done('success');
    } catch (err) {
      console.log(err);
      done('No notes');
    }
  };

  updateOneNote = async (
    req: AuthenticatedRequest<UpdateOneNoteBody>,
    done: Callback,
  ) => {
    try {
      const updateNoteId = req.body?.person?.id;
      const doc = await NoteModel.findOne({
        id: updateNoteId,
        userId: req.auth.sub,
      });
      if (!doc) return done('Error');

      const update = req.body.person;
      if (update.heading) doc.heading = update.heading;
      if (doc.dataLable) {
        if (req.body.delete) {
          const newLable = doc.dataLable.filter(
            (item: NoteDataLabel) =>
              JSON.stringify(item) !== JSON.stringify(update.dataLable),
          );
          doc.dataLable = newLable;

          if (update.heading) {
            this.syncDeleteV2Note(req, () => {});
          }
        } else if (update.dataLable.edit) {
          const { dataLable } = update;
          const docDataLable = JSON.parse(
            JSON.stringify(doc.dataLable),
          ) as NoteDataLabel[];
          const ind = docDataLable.findIndex(
            (item: NoteDataLabel) => item.data === dataLable.data,
          );
          if (docDataLable[ind]) {
            docDataLable[ind].data = dataLable.edit ?? 'Empty Value';
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

  updateSiteLog = async (
    req: AuthenticatedRequest<unknown, SiteLogQuery>,
    done: Callback,
  ) => {
    try {
      const sitesId = 'KdE0rnAoFwb7BaRJgaYd';
      const userId = '68988da2b947c4d46023d679';
      const doc = await NoteModel.findOne({ id: sitesId, userId });
      if (!doc || !doc.dataLable) return done('fail');

      doc.heading = 'Site Track';
      const { referer } = req.headers;
      const refererHeader = Array.isArray(referer) ? referer[0] : referer;
      if (
        refererHeader?.includes('localhost') ||
        refererHeader?.includes('127.0.0.1')
      )
        return done('Not logged');

      const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      let data = `Referer: ${refererHeader ?? ''}\nIp: ${ip}\n SA Date: ${calcTimeNowOffset('+2')}\n https://ipapi.co/${ip}/`;
      let siteTag = 'Site one';
      if (refererHeader) {
        const siteName = `${refererHeader.replace('http://', '').replace('https://', '')}`;
        if (siteName) {
          siteTag = siteName.substring(0, siteName.indexOf('/'));
        }
      }
      const websiteName = req.query && req.query.site ? req.query.site : '';
      if (websiteName && websiteName !== '') siteTag = websiteName;
      console.log('siteTag', siteTag);
      const ipData = await fetch(
        `http://ip-api.com/json/${ip}?fields=country,regionName,city,timezone,org`,
      );
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
      const docs = await NoteModel.find({
        createdBy: 'Henry',
        userId: 'UUvFcBXO6Q',
        heading: 'TranslationPractice',
      });
      const result = docs[0].dataLable?.reduce(
        (acc: Record<string, string>, { tag, data }: NoteDataLabel) => {
          const formatted = data.trim().endsWith('.')
            ? `${data} `
            : `${data}. `;
          if (tag) {
            acc[tag] = acc[tag] ? `${acc[tag]}${formatted}` : formatted;
          }
          return acc;
        },
        {},
      );
      done(result ?? {});
    } catch (err) {
      console.log(err);
      done(null);
    }
  };

  getTranslationLevels = async (done: Callback) => {
    try {
      const docs = await this.getOneLevelDown(
        '68988da2b947c4d46023d679',
        'TranslationPractice',
      );
      const levels = Object.fromEntries(
        Object.keys(docs).map((key) => [
          docs[key].heading,
          docs[key].dataLable.map((d) => d.name),
        ]),
      );
      delete levels.TranslationPractice;
      done(levels);
    } catch (err) {
      console.log(err);
      done(null);
    }
  };

  getFullTranslationPractice = async (done: Callback) => {
    try {
      const docs = await NoteModel.find({ createdBy: 'TranslationPractice' });
      const result = docs.reduce(
        (
          acc: Record<string, Record<string, string>>,
          { heading, dataLable },
        ) => {
          const nested = (dataLable ?? []).reduce(
            (noteAcc: Record<string, string>, { tag, data }: NoteDataLabel) => {
              const formatted = data.trim().endsWith('.')
                ? `${data} `
                : `${data}. `;
              if (tag) {
                noteAcc[tag] = noteAcc[tag]
                  ? `${noteAcc[tag]}${formatted}`
                  : formatted;
              }
              return noteAcc;
            },
            {},
          );

          if (heading) {
            acc[heading] = nested;
          }
          return acc;
        },
        {},
      );

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

  getSavedTranslation = async (
    req: QueryRequest<SavedTranslationQuery>,
    done: Callback,
  ) => {
    try {
      const level = req?.query?.level;
      const subLevel = req?.query?.subLevel;
      if (!level || !subLevel) {
        done(null);
        return;
      }

      const levelDoc = await NoteV2Model.findOne({
        name: level,
        parentId: 'TranslationPractice',
      });
      if (!levelDoc) {
        done(null);
        return;
      }
      const subLevelDoc = await NoteV2Model.findOne({
        name: subLevel,
        parentId: levelDoc.id,
      });
      if (!subLevelDoc) {
        done(null);
        return;
      }
      const docs = await NoteV2Model.find({
        parentId: subLevelDoc.id,
        type: 'NOTE',
      }).sort({ _id: 1 });

      const english = this.splitSentences(docs[0]?.content?.data ?? '');
      const german =
        docs.length > 1
          ? this.splitSentences(docs[1]?.content?.data ?? '')
          : [];
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

  getNoteV2Content = async (
    req: AuthenticatedRequest<unknown, V2ParentQuery>,
    done: Callback,
  ) => {
    try {
      const userId = req?.auth?.sub;
      const docs = await NoteV2Model.find({
        userId,
        parentId: req.query.parentId ?? '',
      }).sort({ _id: 1 });
      done(docs);
    } catch (err) {
      console.log(err);
      done('No notes');
    }
  };

  getOneLevelDown = async (userId: string, rootParentId: string) => {
    // Level 1: direct children of the root parent
    const currentNote = await NoteV2Model.findOne({ userId, id: rootParentId });
    const level1 = await NoteV2Model.find({
      userId,
      parentId: rootParentId,
    }).sort({ _id: 1 });

    const level1Ids = level1.map((n) => n.id);

    // Level 2: children of each level-1 node
    const level2 = await NoteV2Model.find({
      userId,
      parentId: { $in: level1Ids },
    }).sort({ _id: 1 });

    const map: NoteItemMap = {};

    // root -> its direct children
    // console.log('currentNote',currentNote);
    map[rootParentId] = {
      heading: currentNote?.name ?? '',
      id: rootParentId,
      dataLable: level1,
    };

    // each level-1 node id -> its children
    for (const child of level2) {
      if (!map[child.parentId]) {
        const heading = level1.find((l) => l.id === child.parentId)?.name;
        map[child.parentId] = {
          id: child.parentId,
          heading,
          dataLable: [],
        };
      }
      map[child.parentId].dataLable.push(child);
    }

    return map;
  };

  getNoteV2ContentWithChildren = async (
    req: AuthenticatedRequest<unknown, V2ParentQuery>,
    done: Callback,
  ) => {
    try {
      const userId = req?.auth?.sub;
      const docs = await this.getOneLevelDown(userId, req.query.parentId ?? '');
      done(docs);
    } catch (err) {
      console.log(err);
      done('No notes');
    }
  };

  newV2Note = async (
    req: AuthenticatedRequest<NewV2NoteBody>,
    done: Callback,
  ) => {
    try {
      const userId = req.auth.sub;
      const { id, parentId, type, content, name } = req.body;

      const existing = await NoteV2Model.findOne({ userId, id });
      if (existing) {
        console.log('Note with this id already Created!');
        done(existing);
        return;
      }

      const existingParent = await NoteV2Model.findOne({
        userId,
        id: parentId,
      });
      if (!existingParent) {
        const folder: NoteV2Attrs = {
          name: parentId,
          id: parentId,
          parentId: '',
          type: 'FOLDER',
          userId,
        };
        const createHighLevelFolder = new NoteV2Model(folder);
        await createHighLevelFolder.save();
      }

      const note: NoteV2Attrs = {
        id,
        parentId,
        type,
        content,
        userId,
      };

      if (type === 'LOG') {
        const parentData = await NoteV2Model.findOne({
          userId,
          id: parentId,
        });
        if (parentData?.name !== 'Log') {
          // Parent isn't a log folder. Check if the parent has a Log folder
          const logParent = await NoteV2Model.findOne({
            userId,
            parentId,
            name: 'Log',
          });

          if (logParent) {
            // Correct parent found
            note.parentId = logParent.id;
          } else {
            // Log parent folder needs to be created;
            const newLogParent = {
              id: `${parentId}::Log`,
              parentId,
              type: 'FOLDER',
              name: 'Log',
              userId,
            };
            const createFolder = new NoteV2Model(newLogParent);
            const folderData = await createFolder.save();
            if (folderData) note.parentId = newLogParent.id;
          }
        }
      }

      if (name) note.name = name;
      const createNote = new NoteV2Model(note);
      const data = await createNote.save();
      done(data);
    } catch (err: unknown) {
      console.log(err);
      done(getErrorName(err) ?? 'Error');
    }
  };

  updateV2Note = async (
    req: AuthenticatedRequest<UpdateV2NoteBody>,
    done: Callback,
  ) => {
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

  deleteV2Note = async (
    req: AuthenticatedRequest<DeleteV2NoteBody>,
    done: Callback,
  ) => {
    try {
      const userId = req.auth.sub;
      const { id, type } = req.body;
      if (type === 'FOLDER') {
        await this.moveAllChilderToParentFolder(userId, id);
      }
      const data = await NoteV2Model.deleteOne({ id, userId });
      done(data);
    } catch (err) {
      console.log(err);
      done('Error');
    }
  };

  moveAllChilderToParentFolder = async (userId: string, id: string) => {
    const folderToEmpty = await NoteV2Model.findOne({ id, userId });
    if (folderToEmpty) {
      const resp = await NoteV2Model.updateMany(
        { parentId: folderToEmpty.id, userId },
        { $set: { parentId: folderToEmpty.parentId } },
      );
      console.log('Notes Moved to parent:', resp?.matchedCount);
    }
  };

  syncUpdateV2Note = async (
    req: AuthenticatedRequest<UpdateOneNoteBody>,
    done: Callback,
  ) => {
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
        doc.content = {
          ...(doc.content ?? {}),
          data: newContent.data,
          date: newContent.date,
        };
      }
      const data = await doc.save();
      done(data);
    } catch (err) {
      console.log(err);
      done('Error');
    }
  };

  syncCreateV2Note = async (
    req: AuthenticatedRequest<UpdateOneNoteBody>,
    done: Callback,
  ) => {
    const { body } = req;
    const { person } = body;
    const isNote = !person.dataLable.data.includes('"json":true');
    const parentId = `${person.id}::${person.dataLable.tag}`;
    const jsonDataLableData = !isNote
      ? JSON.parse(person.dataLable.data)
      : undefined;
    const content = isNote
      ? { data: person.dataLable.data }
      : { data: jsonDataLableData.data, date: jsonDataLableData.date };

    if (!isNote) {
      const userId = req.auth.sub;

      const logDirCreate = {
        id: `${person.id}::Log`,
        userId,
        parentId: person.id,
        type: 'FOLDER',
        name: 'Log',
      };
      const logDirCreateReq = { ...req, body: logDirCreate };

      this.newV2Note(logDirCreateReq, () => {
        console.log('Log Dir created');

        const logDay = jsonDataLableData?.date
          ? formatDate(jsonDataLableData.date.substring(0, 16).trim())
          : 'unknown';
        const logDayId = `${logDirCreate.id}::${logDay}`
          .trim()
          .replaceAll(' ', '-');
        const logDayCreate = {
          id: logDayId,
          userId,
          parentId: logDirCreate.id,
          type: 'FOLDER',
          name: logDay,
        };
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

  syncDeleteV2Note = async (
    req: AuthenticatedRequest<UpdateOneNoteBody>,
    done: Callback,
  ) => {
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

  syncCreateV1Note = (
    req: AuthenticatedRequest<NewV2NoteBody>,
    done: Callback,
  ) => {
    const mapped = mapNoteV2ToNoteV1(req.body);
    const syncReq = { ...req, body: mapped };
    syncReq.body.userId = req.auth?.sub;

    const method =
      req.body.type === 'FOLDER' ? this.newNote : this.updateOneNote;
    const data = req.body.type === 'FOLDER' ? syncReq.body : syncReq;

    method(data, (resp) => {
      if (resp.includes('Error')) {
        console.log('Note V1 not updated!', mapped?.person?.id);
      } else {
        console.log('Updated Note V1', mapped?.person?.id);
      }
      done('ok');
    });
  };

  syncUpdateV1Note = async (
    req: AuthenticatedRequest<UpdateV2NoteBody>,
    done: Callback,
  ) => {
    try {
      const userId = req.auth.sub;
      const doc = await NoteV2Model.findOne({ id: req.body.id, userId });
      if (!doc) {
        done('No Note found');
        return;
      }
      const edit = doc.content?.date
        ? JSON.stringify({
            json: true,
            date: doc.content?.date,
            data: doc.content.data,
          })
        : doc.content?.data;
      const data = { ...req.body, edit };
      const mapped = mapNoteV2ToNoteV1(data);
      const syncReq = { ...req, body: mapped };

      this.updateOneNote(syncReq, (resp) => {
        if (resp.includes('Error')) {
          console.log('Note V1 not updated!', mapped?.person?.id);
        } else {
          console.log('Updated Note V1', mapped?.person?.id);
        }
        done(resp);
      });
    } catch (err) {
      console.log('Error', err);
      done('Error');
    }
  };

  syncDeleteV1Note = async (
    req: AuthenticatedRequest<DeleteV2NoteBody>,
    done: Callback,
  ) => {
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
        if (resp.includes('Error')) {
          console.log('Note V1 not updated!', mapped?.person?.id);
        } else {
          console.log('Updated Note V1', mapped?.person?.id);
        }
        done(resp);
      });
    } catch (err) {
      console.log('Error', err);
      done('Error');
    }
  };
}
