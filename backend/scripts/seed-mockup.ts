/* eslint-disable no-console, no-await-in-loop */
/**
 * Seeds the LOCAL dev database with exactly the entries the mockups in docs/mockups use, under a separate account
 * (mock@example.test), so the app can be pixel-compared with the mockup HTML (clock frozen at 10 Nov 2026 14:30).
 *
 *   MONGODB_URI=mongodb://localhost:27017/notes-dev npx ts-node --transpile-only scripts/seed-mockup.ts
 *
 * Refuses to run unless the Mongo host is localhost / 127.0.0.1. Needs the local API running (POST /api/register).
 */
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';
const API_URL = (process.env.SEED_API_URL || 'http://localhost:8080').replace(/\/$/, '');
const EMAIL = process.env.MOCK_EMAIL || 'mock@example.test';
const DESKTOP = EMAIL === 'mockdesk@example.test'; // the desktop mockup shows a smaller Henry notebook
const NOTES = EMAIL === 'mocknotes@example.test'; // notes-phone.html: a folder of 3 notes and the open "Welcome note"
const PASSWORD = 'MockPassword123!';
const host = (MONGODB_URI.match(/^mongodb:\/\/(?:[^@/]*@)?([^/?:,]+)/i) || [])[1]?.toLowerCase();
if (!MONGODB_URI || (host !== 'localhost' && host !== '127.0.0.1')) {
  console.error('Refusing to run: MONGODB_URI must point at localhost or 127.0.0.1.');
  process.exit(1);
}

const pad = (n: number) => String(n).padStart(2, '0');
const iso = (y: number, mo: number, d: number, hm: string) => {
  const [h, m] = hm.split(':').map(Number);
  const dt = new Date(y, mo - 1, d, h, m, 0, 0);
  const off = -dt.getTimezoneOffset();
  const sign = off >= 0 ? '+' : '-';
  return `${y}-${pad(mo)}-${pad(d)}T${pad(h)}:${pad(m)}:00${sign}${pad(Math.floor(Math.abs(off) / 60))}:${pad(Math.abs(off) % 60)}`;
};

type Doc = Record<string, unknown>;
const docs: Doc[] = [];
let userId = '';
const add = (d: Doc) => docs.push({ ...d, userId, createdAt: new Date(), updatedAt: new Date(), __v: 0 });
const folder = (id: string, parentId: string, name: string, settings?: Doc) =>
  add({ id, parentId, type: 'FOLDER', name, ...(settings ? { settings } : {}) });
let n = 0;
const note = (parentId: string, data: string) => add({ id: `${parentId}::NOTE::m${(n += 1)}`, parentId, type: 'NOTE', content: { data } });
const entry = (logId: string, data: string, date: string) =>
  add({ id: `${logId}::LOG::m${(n += 1)}`, parentId: logId, type: 'LOG', content: { data, date } });

const main = async () => {
  await mongoose.connect(MONGODB_URI);
  const users = mongoose.connection.collection('users');
  if (!(await users.countDocuments({ email: EMAIL }))) {
    const res = await fetch(`${API_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName: 'Mock', lastName: 'User', email: EMAIL, password: PASSWORD }),
    });
    if (!res.ok && res.status !== 409) throw new Error(`register failed ${res.status}`);
  }
  const u = await users.findOne({ email: EMAIL });
  if (!u) throw new Error('The API user is not in the local database: the backend is not using MONGODB_URI.');
  userId = String(u._id);
  await mongoose.connection.collection('notes-v2').deleteMany({ userId });

  // ---- notebooks
  // menu-login.html lists Henry, Rapitag, Koorvi (and Site Track) for the notes account.
  for (const nb of NOTES ? ['Henry', 'Rapitag', 'Koorvi', 'Site Track'] : ['Henry', 'Koorvi', 'Rapitag']) add({ id: nb, parentId: '', type: 'FOLDER', name: nb });
  if (NOTES) {
    // notes-phone.html 1: "Life so far" with 3 notes changed today 14:30, yesterday and on 5 Nov.
    const lsf = 'Henry::FOLDER::Life-so-far';
    folder(lsf, 'Henry', 'Life so far');
    const at = (d: Date) => ({ createdAt: d, updatedAt: d });
    const dated = (parentId: string, data: string, d: Date) => {
      note(parentId, data);
      Object.assign(docs[docs.length - 1], at(d));
    };
    dated(lsf, 'Life so far note 1\n\nSome text for life so far number 1.', new Date(2026, 10, 5, 9, 12));
    dated(lsf, 'Life so far note 2\n\nSome text for life so far number 2.', new Date(2026, 10, 9, 18, 3));
    dated(lsf, 'Life so far note 3\n\nSome text for life so far number 3.', new Date(2026, 10, 10, 14, 30));
    // notes-phone.html 2: the open "Welcome note" (its own folder, also called "Life so far").
    const lsf2 = 'Henry::FOLDER::Life-so-far-2';
    folder(lsf2, 'Henry', 'Life so far');
    dated(
      lsf2,
      'Welcome note\n\nWelcome note with **bold** and a list:\n\n1. one\n2. two\n\nLinks stay clickable: [youtube.com/watch?v=bG0h7bSfxQI](https://www.youtube.com/watch?v=bG0h7bSfxQI)',
      new Date(2026, 10, 10, 14, 30),
    );
    await mongoose.connection.collection('notes-v2').insertMany(docs);
    console.log(`Mockup seed done: ${docs.length} documents for ${EMAIL}.`);
    await mongoose.disconnect();
    return;
  }
  // Henry: folder counts of the home mockup (children per folder)
  const counts: Record<string, number> = { Bookmarks: 18, Climbing: 3, 'Dev Code': 22, 'Life so far': 28 };
  for (const [name, c] of Object.entries(DESKTOP ? { Bookmarks: 2 } : counts)) {
    const id = `Henry::FOLDER::${name.replace(/\s+/g, '-')}`;
    folder(id, 'Henry', name);
    for (let i = 1; i <= c; i += 1) note(id, `${name} note ${i}\n\nText ${i}`);
  }
  // ---- Koorvi Track: the log-screen mockup (10 Nov, 9 Nov, 5 Nov, 9 Jun) and the days of the summary week
  folder('Koorvi::FOLDER::Track', 'Koorvi', 'Track');
  const tl = 'Koorvi::FOLDER::Track::Log';
  folder(tl, 'Koorvi::FOLDER::Track', 'Log', { mode: 'time-tracker', pinned: true });
  const day = (y: number, mo: number, d: number, rows: Array<[string, string]>) => rows.forEach(([t, text]) => entry(tl, text, iso(y, mo, d, t)));
  day(2026, 6, 9, [['08:01', 'Start'], ['08:21', 'Get dev to work after hot fix'], ['09:00', '\u{1F469}\u{1F3FB}‍\u{1F4BB} Standup'], ['09:21', 'Fix check so dhl works on staging'], ['10:58', 'Break'], ['11:22', 'DEV-127 Staging Bugs: DHL label broken & condition confirmation stuck'], ['11:31', 'Meeting: \n\u{1F977} Black Belt of the Month'], ['11:40', 'DEV-127 Staging Bugs: DHL label broken & condition confirmation stuck'], ['12:14', 'Break'], ['12:39', 'Investigate tools to find malware'], ['13:39', 'Call with Jan to explain new gcloud login step for functions'], ['13:46', 'Investigate tools to find malware'], ['14:22', 'DEV-127 Staging Bugs: DHL label broken & condition confirmation stuck'], ['15:31', 'Stop']]);
  day(2026, 11, 2, [['08:30', 'Start'], ['08:40', 'DEV-244 Migrate database from Firebase RTDB to Firestore'], ['13:00', 'Stop']]);
  day(2026, 11, 3, [['08:00', 'Start'], ['08:10', 'DEV-244 Migrate database from Firebase RTDB to Firestore'], ['15:20', 'Stop']]);
  day(2026, 11, 4, [['08:00', 'Start'], ['08:10', 'DEV-244 Migrate database from Firebase RTDB to Firestore'], ['16:10', 'Stop']]);
  day(2026, 11, 5, [['09:00', 'Standup'], ['09:12', 'Break'], ['12:02', 'DEV-244 Migrate database from Firebase RTDB to Firestore'], ['18:46', 'Stop']]);
  day(2026, 11, 9, [['09:00', 'Weekly Planning'], ['09:27', 'Break'], ['16:37', 'Stop']]);
  day(2026, 11, 10, [['08:40', 'Start'], ['09:00', 'Standup'], ['09:20', 'Break'], ['09:43', 'DEV-244 Migrate database from Firebase RTDB to Firestore'], ['11:12', 'Break'], ['11:38', 'DEV-244 Migrate database from Firebase RTDB to Firestore'], ['12:45', 'DEV-313 Trade-in credit note numbers reset and duplicated']]);

  if (!DESKTOP) folder('Henry::FOLDER::Break', 'Henry', 'Break');
  if (!DESKTOP) for (const p of ['Break P1', 'Break P2', 'Break P3', 'Break P4', 'Break P5']) folder(`Henry::FOLDER::Break::FOLDER::${p.replace(' ', '-')}`, 'Henry::FOLDER::Break', p);
  const p5 = DESKTOP ? 'Henry::FOLDER::Bookmarks::FOLDER::Break-P5' : 'Henry::FOLDER::Break::FOLDER::Break-P5';
  const p5log = `${p5}::Log`;
  if (DESKTOP) folder(p5, 'Henry::FOLDER::Bookmarks', 'Break P5'); // hidden inside the collapsed Bookmarks folder
  folder(p5log, p5, 'Log', { mode: 'tally', pinned: true });
  folder('Henry::FOLDER::Train', 'Henry', 'Train');
  const core = 'Henry::FOLDER::Train::FOLDER::Core';
  folder(core, 'Henry::FOLDER::Train', 'Core');
  folder('Henry::FOLDER::Train::FOLDER::Arms', 'Henry::FOLDER::Train', 'Arms');
  folder('Henry::FOLDER::Train::Log', 'Henry::FOLDER::Train', 'Log');
  for (let i = 1; i <= 6; i += 1) note('Henry::FOLDER::Train', `Train note ${i}\n\nText ${i}`);
  if (DESKTOP) {
    folder('Henry::FOLDER::Life-so-far', 'Henry', 'Life so far');
    note('Henry::FOLDER::Life-so-far', 'Life note\n\nText');
  }
  note(core, 'Human Flag\n1. Grip straight arm side plank both sides\n2. Grip straight arm side plank lifting leg\n3. Flag bounce\n4. Flag bounce with closed legs\n5. Flag negatives\n6. Flag raises\n\n[youtube.com/watch?v=bG0h7bSfxQI](https://www.youtube.com/watch?v=bG0h7bSfxQI)');
  note(core, 'L sit\nStretches, standing forward folds...');
  note(core, 'General core\nWindshield wipers, straight arm...');
  note(core, 'Shoulder progression\nWarm up, high side plank raises...');

  // Break P5 tally: today 07:41, 11:15; earlier days with the counts of the 14-day chart
  // Entries per day of the 14-day chart (the last two are yesterday and today); same-day gaps average 3h 9m.
  const perDay = [4, 5, 5, 5, 4, 3, 5, 5, 4, 4, 7, 3];
  const codes = ['P', 'V', 'P v2'];
  perDay.forEach((c, i) => {
    const d = new Date(2026, 10, 10 - (13 - i));
    for (let k = 0; k < c; k += 1) {
      const mins = 10 + k * 188;
      entry(p5log, codes[k % 3], iso(d.getFullYear(), d.getMonth() + 1, d.getDate(), `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`));
    }
  });
  ['06:40', '10:07', '12:58', '16:09', '19:20'].forEach((t, k) => entry(p5log, 'P', iso(2026, 11, 9, t)));
  entry(p5log, 'P', iso(2026, 11, 10, '07:41'));
  entry(p5log, 'P', iso(2026, 11, 10, '11:15'));

  // The day summary mockup uses other task titles and its own week: a second log with exactly those entries.
  folder('Koorvi::FOLDER::Summary', 'Koorvi', 'Summary');
  const sl = 'Koorvi::FOLDER::Summary::Log';
  folder(sl, 'Koorvi::FOLDER::Summary', 'Log', { mode: 'time-tracker' });
  const sday = (y: number, mo: number, d: number, rows: Array<[string, string]>) => rows.forEach(([t, text]) => entry(sl, text, iso(y, mo, d, t)));
  const T244 = 'DEV-244 Firestore migration';
  const T313 = 'DEV-313 Credit note numbers';
  sday(2026, 11, 2, [['08:30', 'Start'], ['08:40', T244], ['12:55', 'Stop']]); // 265 min
  sday(2026, 11, 3, [['08:00', 'Start'], ['08:10', T244], ['15:19', 'Stop']]); // 429 min
  sday(2026, 11, 4, [['08:00', 'Start'], ['08:10', T244], ['16:10', 'Stop']]); // 480 min
  sday(2026, 11, 5, [['09:00', 'Standup'], ['09:12', 'Break'], ['12:02', T244], ['17:56', 'Stop']]); // 366 min
  sday(2026, 11, 9, [['09:00', 'Weekly Planning'], ['09:27', 'Break'], ['16:37', 'Stop']]);
  sday(2026, 11, 10, [['08:40', 'Start'], ['09:00', 'Standup'], ['09:20', 'Break'], ['09:43', T244], ['11:12', 'Break'], ['11:38', T244], ['12:45', T313]]);

  await mongoose.connection.collection('notes-v2').insertMany(docs);
  console.log(`Mockup seed done: ${docs.length} documents for ${EMAIL}.`);
  await mongoose.disconnect();
};
main().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
