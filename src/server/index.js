const express = require('express');
var getNotes = require("./routes/getNotes");
var updateNotes = require("./routes/updateNotes");
const bodyParser = require('body-parser')



const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

require('dotenv').config()

app.use(express.static('dist'));
app.use("/api/note", getNotes);


updateNotes(app)

app.get('/*', function (req, res) {

  res.redirect("/");
 });
app.listen(process.env.PORT || 8080, () => console.log(`Listening on port ${process.env.PORT || 8080}!`));
