let express = require('express');
let router = express.Router();
let Handler = require('../controllers/handlers.js');

let dbHandler = new Handler();

router.get('/', function(req, res) {
  let user = req.query.user;
  if (user === 'all' || user === 'All') {
    dbHandler.getAllNotes(req, docs => {
      res.json(docs);
    });
  } else {
    let noteHeading = req.query.noteHeading;
    if (noteHeading) {
      dbHandler.getNote(req, docs => {
        res.json(docs);
      });
    } else {
      dbHandler.getMyNotes(req, docs => {
        res.json(docs);
      });
    }
  }
  // res.json(noteDummy)
});

module.exports = router;
