const express = require('express');

const router = express.Router();
const Handler = require('../controllers/handlers.js');

const dbHandler = new Handler();

router.get('/', (req, res) => {
  dbHandler.getNoteNames(req, (docs) => {
    res.json(docs);
  });
});

module.exports = router;
