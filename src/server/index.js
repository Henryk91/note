const express = require('express');
let getNotes = require('./routes/getNotes');
let getNoteNames = require('./routes/getNoteNames');
let updateNotes = require('./routes/updateNotes');
let userCheck = require('./routes/userCheck');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

require('dotenv').config();

app.use(express.static('dist'));
app.use('/api/note', getNotes);
app.use('/api/note-names', getNoteNames);

updateNotes(app);

userCheck(app);

app.get('/*', function(req, res) {
  res.redirect('/');
});

app.get('/sw.js', (req, res) => {
  res.setHeader('Cache-Control', 'max-age=0, no-cache, no-store, must-revalidate');
  res.sendFile('sw.js', { root: path.join(__dirname, 'dist') });
});
app.listen(process.env.PORT || 8080, () => console.log(`Listening on port ${process.env.PORT || 8080}!`));
