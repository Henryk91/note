let express = require('express');
let router = express.Router();
let Handler = require('../controllers/handlers.js');

let dbHandler = new Handler();

router.get('/', function(req, res) {
  dbHandler.getNoteNames(req, docs => {
    res.json(docs);
  });
});

module.exports = router;
