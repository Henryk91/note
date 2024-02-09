const express = require('express');

const router = express.Router();
const Handler = require('../controllers/handlers.js');
const dbHandler = new Handler();
const cors = require('cors')

router.get('/',cors(), (req, res) => {

  const { user } = req.query;
  const decodedUser = decodeURI(user)
  if (decodedUser === 'all' || decodedUser === 'All') {
    dbHandler.getAllNotes(req, (docs) => {
      res.json(docs);
    });
  } else {
    const { noteHeading } = req.query;
    const decodedNoteHeading = decodeURI(noteHeading)
    
    if (noteHeading) {
      console.log("Trying to getNote", decodedNoteHeading)
      dbHandler.getNote(req, (docs) => {
        res.json(docs);
      });
    } else {
        dbHandler.getMyNotes(req, (docs) => {
          console.log('Responding with docs');
          res.json(docs);
      });
    }
  }
  // res.json(noteDummy)
});

module.exports = router;
