/* eslint-disable func-names */
const Handler = require('../controllers/handlers.js');
const cors = require('cors');
const dbHandler = new Handler();

module.exports = function (app) {
  app.post('/api/save', (req, res) => {
    dbHandler.newNote(req.body, dbResp => res.json({ Ok: dbResp }));
  });
  app.post('/api/update', (req, res) => {
    dbHandler.updateNote(req, dbResp => res.json({ Ok: dbResp }));
    res.json({ Ok: '100' });
  });
  app.post('/api/update-one', (req, res) => {
    dbHandler.updateOneNote(req, (dbResp) => {
      res.json({ Ok: dbResp });
    });
    // res.json({ Ok: '100' });
  });

  app.get('/api/log*',cors(), (req, res) => {
    dbHandler.updateSiteLog(req, (dbResp) => {
      console.log('req.headers',req.headers);
      res.json({ Ok: dbResp });
    });
  });
};
