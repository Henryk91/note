const express = require('express');
var getNotes = require("./routes/getNotes");
var getNoteNames = require("./routes/getNoteNames");
var updateNotes = require("./routes/updateNotes");
var userCheck = require("./routes/userCheck");
const bodyParser = require('body-parser')



const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

require('dotenv').config()

app.use(express.static('dist'));
app.use("/api/note", getNotes);
app.use("/api/note-names", getNoteNames);

updateNotes(app)

userCheck(app)

app.get('/*', function (req, res) {
  res.redirect("/");
 });
app.listen(process.env.PORT || 8080, () => console.log(`Listening on port ${process.env.PORT || 8080}!`));
