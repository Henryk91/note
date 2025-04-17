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

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

require('dotenv').config();

app.use(express.static('dist'));
app.use('/api/note', getNotes);
app.use('/api/note-names', getNoteNames);

translate(app);
updateNotes(app);
getDashData(app);
sendEmail(app);

userCheck(app);

app.get('/*', (req, res) => {
  console.log('res',req.url);
  if(req && req.query && req.query.tempPass){
    console.log('tempPasstempPass');
    res.redirect('/notes/main');
  } else {
    console.log('redirectredirect');
    res.redirect('/');
  }
});

app.get('/sw.js', (req, res) => {
  res.setHeader('Cache-Control', 'max-age=0, no-cache, no-store, must-revalidate');
  res.sendFile('sw.js', { root: path.join(__dirname, 'dist') });
});
app.listen(process.env.PORT || 8080, () => console.log(`Listening on port ${process.env.PORT || 8080}!`));
