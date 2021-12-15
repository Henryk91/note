/* eslint-disable no-undef */
const express = require('express');
const bodyParser = require('body-parser');
const getNotes = require('./routes/getNotes');
const getNoteNames = require('./routes/getNoteNames');
const updateNotes = require('./routes/updateNotes');
const userCheck = require('./routes/userCheck');
const getDashData = require('./routes/getDashData');
const sendEmail = require('./routes/sendEmail');
// const sock = require('./routes/sock');

const app = express();

// sock(app)

const INDEX = '/index.html';
  // const PORT = process.env.PORT || 8090;
const PORT = 8090;
const server = express()
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const socketIO = require('socket.io');
const io = socketIO(server);

//Whenever someone connects this gets executed
io.on('connection', function(socket) {
   console.log('A user connected');

   //Whenever someone disconnects this piece of code executed
   socket.on('disconnect', function () {
      console.log('A user disconnected');
   });
});

setInterval(() => io.emit('time', new Date().toTimeString()), 1000);


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

require('dotenv').config();

app.use(express.static('dist'));
app.use('/api/note', getNotes);
app.use('/api/note-names', getNoteNames);

updateNotes(app);
getDashData(app);
sendEmail(app);

userCheck(app);

app.get('/*', (req, res) => {
  console.log('res',req.url);
  res.redirect('/');
});

app.get('/sw.js', (req, res) => {
  res.setHeader('Cache-Control', 'max-age=0, no-cache, no-store, must-revalidate');
  res.sendFile('sw.js', { root: path.join(__dirname, 'dist') });
});
app.listen(process.env.PORT || 8080, () => console.log(`Listening on port ${process.env.PORT || 8080}!`));
