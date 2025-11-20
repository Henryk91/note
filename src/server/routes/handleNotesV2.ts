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

  dbHandler.syncCreateV1Note(req, (docs) => {
    console.log('Created Note V1');
  });
});

router.put('/', (req, res) => {
  dbHandler.updateV2Note(req, (docs) => {
    res.json(docs);
  });
  
  dbHandler.syncUpdateV1Note(req, (docs) => {
    console.log('Updated Note V1');
  });
});

router.delete('/', (req, res) => {
  dbHandler.deleteV2Note(req, (docs) => {
    res.json(docs);
  });

  dbHandler.syncDeleteV1Note(req, (docs) => {
    console.log('Deleted Note V1');
  });
});

module.exports = router;
