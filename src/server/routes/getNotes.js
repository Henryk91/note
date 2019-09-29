const express = require('express');

const router = express.Router();
const Handler = require('../controllers/handlers.js');

const dbHandler = new Handler();

router.get('/', (req, res) => {
  const { user } = req.query;
  if (user === 'all' || user === 'All') {
    dbHandler.getAllNotes(req, (docs) => {
      res.json(docs);
    });
  } else {
    const { noteHeading } = req.query;
    if (noteHeading) {
      dbHandler.getNote(req, (docs) => {
        res.json(docs);
      });
    } else {
      dbHandler.getMyNotes(req, (docs) => {
        res.json(docs);
      });
    }
  }
  // res.json(noteDummy)
});

module.exports = router;
