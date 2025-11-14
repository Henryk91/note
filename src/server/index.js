/* eslint-disable no-undef */
const express = require('express');
const bodyParser = require('body-parser');
const getNotes = require('./routes/getNotes');
const getNoteNames = require('./routes/getNoteNames');
const updateNotes = require('./routes/updateNotes');
const userCheck = require('./routes/userCheck');
const getDashData = require('./routes/getDashData');
const sendEmail = require('./routes/sendEmail');
const translate = require('./routes/translate');
const jwtSetup = require('./jwt-setup');
const translationScoresRouter = require('./routes/translationScores');
const incorrectTranslationsRoute = require('./routes/incorrectTranslations');

const cookieParser = require('cookie-parser');

const app = express();
const cors = require('cors')

app.use(express.json());

app.use(cookieParser());

const allowedOrigins = [
  'http://localhost:3000',
  'https://lingodrill.com',
  'https://www.lingodrill.com',
  'https://practice.lingodrill.com',
  'http://lingodrill.com',
  'http://www.lingodrill.com',
  'http://practice.lingodrill.com',
  'http://api.lingodrill.com',
  'https://api.lingodrill.com',
  'https://german.lingodrill.com',
  'https://bpmn-collaborator.onrender.com',
];

const isHenrykSubdomain = (origin) => {
  try {
    const { protocol, hostname } = new URL(origin);
    if (protocol !== 'https:') return false;
    return hostname === 'henryk.co.za' || hostname.endsWith('.henryk.co.za');
  } catch (err) {
    return false;
  }
};

const corsOptions = {
  origin(origin, cb) {
    // allow same-origin / server-to-server (no Origin header)
    if (!origin || allowedOrigins.includes(origin) || isHenrykSubdomain(origin)) {
      return cb(null, origin || true);
    }
    return cb(new Error('CORS not allowed'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  optionsSuccessStatus: 204, // For legacy browsers
}

app.use(cors(corsOptions));

// Preflight helper (optional but nice to have)
app.options('*', cors(corsOptions));

require('dotenv').config();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

jwtSetup(app)

app.use(express.static('dist'));
app.use('/api/note', getNotes);
app.use('/api/note-names', getNoteNames);
app.use('/api/translation-scores', translationScoresRouter);
app.use('/api/incorrect-translations', incorrectTranslationsRoute);

translate(app);
updateNotes(app);
getDashData(app);
sendEmail(app);

userCheck(app);

app.get('/*', (req, res) => {
  if(req?.cookies?.access_token && req?.url !== '/notes/main'){
    res.redirect('/notes/main');
  } else {
    res.redirect('/');
  }
});

app.get('/sw.js', (req, res) => {
  res.setHeader('Cache-Control', 'max-age=0, no-cache, no-store, must-revalidate');
  res.sendFile('sw.js', { root: path.join(__dirname, 'dist') });
});
app.listen(process.env.PORT || 8080, () => console.log(`Listening on port ${process.env.PORT || 8080}!`));
