var express = require('express');
var router = express.Router();
var Handler = require('../controllers/handlers.js');

var dbHandler = new Handler();

router.get('/', function(req, res) {
  dbHandler.getNoteNames(req, docs => {
    res.json(docs);
  });
});

module.exports = router;
