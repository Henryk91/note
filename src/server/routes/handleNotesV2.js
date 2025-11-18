const express = require('express');

const router = express.Router();
const Handler = require('../controllers/handlers.js');
const dbHandler = new Handler();

router.get('/', (req, res) => {
  dbHandler.getNoteV2Content(req, (docs) => {
    res.json(docs);
  });
});

router.post('/', (req, res) => {
  dbHandler.newV2Note(req, (docs) => {
    res.json(docs);
  });
});

router.put('/', (req, res) => {
  dbHandler.updateV2Note(req, (docs) => {
    res.json(docs);
  });
});

router.delete('/', (req, res) => {
  dbHandler.deleteV2Note(req, (docs) => {
    res.json(docs);
  });
});

module.exports = router;
