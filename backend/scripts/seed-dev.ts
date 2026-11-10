/* eslint-disable no-console */
/**
 * Seeds the LOCAL development database with data shaped like the real app.
 *
 *   docker start notes-mongo
 *   cd backend
 *   MONGODB_URI=mongodb://localhost:27017/notes-dev JWT_SECRET=dev-secret-1234 REFRESH_SECRET=dev-refresh-1234 \
 *     npm run dev            # in one terminal (the API the seed talks to)
 *   MONGODB_URI=mongodb://localhost:27017/notes-dev npx ts-node scripts/seed-dev.ts
 *
 * SEED_RESET=1 removes the dev user's previous data first.
 * Refuses to run unless the Mongo host is localhost / 127.0.0.1 and the API URL is local.
 * Never reads backend/.env and never connects anywhere else.
 */
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';
const API_URL = (process.env.SEED_API_URL || 'http://localhost:8080').replace(/\/$/, '');
const EMAIL = 'dev@example.test';
const PASSWORD = 'DevPassword123!';

const hostOf = (uri: string): string => {
  const m = uri.match(/^mongodb(?:\+srv)?:\/\/(?:[^@/]*@)?([^/?:,]+)/i);
  return m ? m[1].toLowerCase() : '';
};
const isLocalHost = (h: string) => h === 'localhost' || h === '127.0.0.1';

if (!MONGODB_URI || !isLocalHost(hostOf(MONGODB_URI)) || MONGODB_URI.startsWith('mongodb+srv')) {
  console.error('Refusing to run: MONGODB_URI must be set on the command line and point at localhost or 127.0.0.1.');
  process.exit(1);
}
if (!isLocalHost(new URL(API_URL).hostname)) {
  console.error('Refusing to run: SEED_API_URL must be localhost or 127.0.0.1.');
  process.exit(1);
}

let cookie = '';

const call = async (method: string, path: string, body?: unknown, extra: Record<string, string> = {}) => {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}), ...extra },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const setCookies = (res.headers as any).getSetCookie?.() as string[] | undefined;
  if (setCookies?.length) cookie = setCookies.map((c) => c.split(';')[0]).join('; ');
  return res;
};

// --- date helpers -----------------------------------------------------------------------------
const pad = (n: number) => String(n).padStart(2, '0');
const isoWithOffset = (d: Date) => {
  const off = -d.getTimezoneOffset();
  const sign = off >= 0 ? '+' : '-';
  const abs = Math.abs(off);
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:` +
    `${pad(d.getSeconds())}${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
  );
};
const at = (day: Date, h: number, m: number) => {
  const d = new Date(day);
  d.setHours(h, m, 0, 0);
  return d;
};
/** Older entries use Date.toString(), newer ones ISO 8601 with offset. */
const stamp = (d: Date, useOld: boolean) => (useOld ? d.toString() : isoWithOffset(d));

// --- creation helpers -------------------------------------------------------------------------
let counter = 0;
const uid = () => `${Date.now().toString(36)}${(counter += 1).toString(36)}`;

const post = async (body: Record<string, unknown>) => {
  const res = await call('POST', '/api/note-v2', body);
  if (!res.ok) throw new Error(`POST /api/note-v2 failed (${res.status}) for ${JSON.stringify(body).slice(0, 120)}`);
};

const folder = async (parentId: string, name: string, extra: Record<string, unknown> = {}) => {
  const id = name === 'Log' ? `${parentId}::Log` : `${parentId}::FOLDER::${name.replace(/\s+/g, '-')}`;
  await post({ id, parentId, type: 'FOLDER', name, ...extra });
  return id;
};
const note = async (parentId: string, data: string) =>
  post({ id: `${parentId}::NOTE::${uid()}`, parentId, type: 'NOTE', content: { data } });
// Log entries are inserted in bulk straight into the (local) database: ~1500 API calls would hit the rate limiter.
const pendingEntries: Array<Record<string, unknown>> = [];
const logEntry = async (logId: string, data: string, date: string) => {
  pendingEntries.push({ id: `${logId}::LOG::${uid()}`, parentId: logId, type: 'LOG', content: { data, date } });
};

const weekdaysBack = (count: number): Date[] => {
  const days: Date[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  while (days.length < count) {
    if (d.getDay() !== 0 && d.getDay() !== 6) days.unshift(new Date(d));
    d.setDate(d.getDate() - 1);
  }
  return days;
};

const WORKOUT = `Workout A
#### Warm up
1. Row 5 min
2. Arm circles x 20
3. Hip openers x 10

#### Strength
1. Squat 5 x 5 @ 80kg
2. Bench press 5 x 5 @ 60kg
3. Barbell row 4 x 8 @ 50kg
4. Overhead press 3 x 8 @ 35kg
5. Romanian deadlift 3 x 8 @ 70kg

#### Core
- Plank 3 x 60s
- Hanging knee raises 3 x 12
- Ab wheel 3 x 10
- Side plank 2 x 45s each

#### Notes
Felt strong today, see [programme](https://example.com/programme) and [form check](https://example.com/form).
Next time add 2.5kg to squat.
Stretch 10 min.`;

const MD_NOTES = [
  '## Core routine\n\n1. Plank 60s\n2. Dead bug x 10\n3. **Bird dog** x 10\n\nSee [guide](https://example.com/core).',
  '#### Courses\n\n- Algorithms (week 3)\n- *Distributed systems*\n- `git rebase -i` cheat sheet\n\n```\nnpm run dev\n```',
  'Single line break test\nsecond line\nthird line',
];

const main = async () => {
  await mongoose.connect(MONGODB_URI);
  const users = mongoose.connection.collection('users');

  const before = await users.countDocuments({ email: EMAIL });
  if (before === 0) {
    const reg = await call('POST', '/api/register', { firstName: 'Dev', lastName: 'User', email: EMAIL, password: PASSWORD });
    if (!reg.ok && reg.status !== 409) throw new Error(`register failed (${reg.status})`);
  }
  const login = await call('POST', '/api/login', { email: EMAIL, password: PASSWORD });
  if (!login.ok) throw new Error(`login failed (${login.status})`);
  const userDoc = await users.findOne({ email: EMAIL });
  if (!userDoc) {
    throw new Error('The API user is not in the local database: the backend is NOT using MONGODB_URI. Aborting.');
  }
  const userId = String(userDoc._id);
  console.log(`Seeding as ${EMAIL} (user ${userId})`);

  if (process.env.SEED_RESET === '1') {
    await mongoose.connection.collection('notes-v2').deleteMany({ userId });
    await mongoose.connection.collection('notes').deleteMany({ userId });
    console.log('Removed previous seed data for the dev user.');
  }

  // Idempotent: skip if already seeded.
  const existing = await mongoose.connection.collection('notes-v2').countDocuments({ userId, id: 'Henry' });
  if (existing) {
    console.log('Already seeded. Drop the database to reseed: docker exec notes-mongo mongosh notes-dev --eval "db.dropDatabase()"');
    await mongoose.disconnect();
    return;
  }

  // ---- Henry ------------------------------------------------------------------------------
  // Notebook roots (id = name) are created implicitly by the API when the first child references them.
  const henryLog = await folder('Henry', 'Log', { settings: { mode: 'journal' } });
  const notes = await folder('Henry', 'Notes');
  const notesLog = await folder(notes, 'Log', { settings: { mode: 'daily-value' } });
  const brk = await folder('Henry', 'Break');
  const train = await folder('Henry', 'Train');
  const core = await folder(train, 'Core');
  const trainLog = await folder(train, 'Log', { settings: { mode: 'journal' } });
  const dev = await folder('Henry', 'Dev Code');
  const deep = await folder(dev, 'Snippets');
  const deeper = await folder(deep, 'Shell');

  for (const md of MD_NOTES) await note(core, md);
  await note(dev, '## Dev notes\n\n1. Install node 20\n2. `npm run dev`\n\nSee [docs](https://example.com).');
  await note(deeper, '```\ngrep -rn "TODO" src\n```');
  await note('Henry', 'Welcome note with **bold** and a list:\n\n- one\n- two');

  const days = weekdaysBack(20);
  const today = new Date();

  // Journal
  await logEntry(henryLog, 'Slept well, good day.', stamp(at(days[days.length - 2], 21, 10), false));
  await logEntry(henryLog, 'Planning the week.\nIdeas: redesign the log screen.', stamp(at(days[days.length - 1], 8, 30), false));

  // Daily value (Notes / Log): one value per day at ~06:45, mix of date formats
  for (let i = 0; i < days.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await logEntry(notesLog, `C${30 + (i % 9)}`, stamp(at(days[i], 6, 45), i < 10));
  }

  // A big log (about 2,150 daily entries, like the real Notes / Log) to check open time and scrolling.
  const archive = await folder('Henry', 'Archive');
  const archiveLog = await folder(archive, 'Log', { settings: { mode: 'daily-value' } });
  for (let i = 0; i < 2150; i += 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    // eslint-disable-next-line no-await-in-loop
    await logEntry(archiveLog, `C${20 + ((i * 7) % 40)}`, stamp(at(d, 6, 40 + (i % 15)), i > 400));
  }

  // Train log: a 20+ line Markdown workout entry
  await logEntry(trainLog, WORKOUT, stamp(at(days[days.length - 3], 17, 30), false));
  await logEntry(trainLog, 'Easy run 5km', stamp(at(days[days.length - 1], 6, 15), false));

  // Tally logs: Henry / Break / Break P5 / Log (3 levels deep + Log)
  for (const p of ['Break P4', 'Break P5']) {
    // eslint-disable-next-line no-await-in-loop
    const pf = await folder(brk, p);
    // eslint-disable-next-line no-await-in-loop
    const lf = await folder(pf, 'Log', { settings: { mode: 'tally' } });
    const codes = ['P', 'V', 'P v2'];
    for (let i = 0; i < days.length; i += 1) {
      const n = 1 + ((i * 3) % 6);
      for (let k = 0; k < n; k += 1) {
        // eslint-disable-next-line no-await-in-loop
        await logEntry(lf, codes[(i + k) % 3], stamp(at(days[i], 8 + k * 2, (k * 17) % 60), i < 8));
      }
    }
  }

  // ---- Koorvi: Track / Log as a time tracker ----------------------------------------------
  const track = await folder('Koorvi', 'Track');
  const trackLog = await folder(track, 'Log', { settings: { mode: 'time-tracker', pinned: true } });
  const ticketA = 'DEV-244 Migrate database to the new schema and update the seed scripts';
  const ticketB = 'DEV-313 Review payment webhook';
  const ticketC = 'DEV-211 Fix flaky timesheet export';

  for (let i = 0; i < days.length; i += 1) {
    const day = days[i];
    const old = i < 10;
    const isToday = day.toDateString() === today.toDateString();
    const brkWord = i % 3 === 0 ? 'Break ' : 'Break';
    const plan: Array<[number, number, string]> = [
      [7, 0, 'Start'],
      [7, 5 + (i % 4), 'Standup'],
      [7, 30, ticketA],
      [9, 30, brkWord],
      [9, 45, ticketA],
      [12, 0, 'Lunch'],
      [12, 45, i % 2 ? ticketB : ticketC],
      [14, 30, 'Break'],
      [14, 45, i % 2 ? ticketB : ticketC],
      [16, 30, ticketA],
      [17, 15, 'Stop'],
    ];
    if (i === 5) plan.splice(3, 0, [8, 15, 'Meeting:\nBlack Belt of the Month']);
    if (i === 12) plan.splice(4, 0, [9, 0, 'Code review notes:\n- API naming\n- missing tests\n- check [PR 118](https://example.com/pr/118)']);
    for (const [h, m, text] of plan) {
      const d = at(day, h, m);
      if (isToday && d.getTime() > Date.now()) continue; // eslint-disable-line no-continue
      // eslint-disable-next-line no-await-in-loop
      await logEntry(trackLog, text, stamp(d, old));
    }
  }

  const stamped = new Date();
  await mongoose.connection.collection('notes-v2').insertMany(
    pendingEntries.map((e) => ({ ...e, userId, createdAt: stamped, updatedAt: stamped, __v: 0 })),
  );
  console.log(`Inserted ${pendingEntries.length} log entries.`);

  // ---- Site Track (written straight into the local DB, as the public /api/log endpoint would) ---
  const coll = mongoose.connection.collection('notes-v2');
  const st = 'Site Track';
  const stFolder = `${st}::Site one`;
  const now = new Date();
  const base = { userId, createdAt: now, updatedAt: now, __v: 0 };
  await coll.insertMany([
    { ...base, id: st, parentId: '', type: 'FOLDER', name: st },
    { ...base, id: stFolder, parentId: st, type: 'FOLDER', name: 'Site one' },
    ...[
      'Referer: <img src=x onerror=alert(1)>\nIp: 203.0.113.9\n SA Date: now\n https://ipapi.co/203.0.113.9/',
      'Referer: https://example.com/?q=<script>alert(2)</script>\nIp: 203.0.113.10\n SA Date: now',
      'Referer: [click](javascript:alert(3)) <a href="javascript:alert(4)">x</a>\nIp: 203.0.113.11',
      'Referer: https://news.example.org\nIp: 198.51.100.4\nCountry: South Africa\nCity: Cape Town',
    ].map((data, i) => ({
      ...base,
      id: `${stFolder}::NOTE::seed${i}`,
      parentId: stFolder,
      type: 'NOTE',
      content: { data },
    })),
  ]);

  console.log('Done. Log in with the seeded dev account (see backend/scripts/seed-dev.ts for the credentials).');
  await mongoose.disconnect();
};

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
