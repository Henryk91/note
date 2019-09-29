/* eslint-disable func-names */
const Handler = require('../controllers/handlers.js');

const dbHandler = new Handler();

module.exports = function (app) {
  app.post('/api/login', (req, res) => {
    let docId = '';
    dbHandler.userLogin(req.body, (dbResp) => {
      docId = dbResp;

      if (docId.indexOf('Login') < 0) {
        res.json({ id: docId });
      }
    });
  });
  app.post('/api/register', (req, res) => {
    let docId = '';
    dbHandler.newUser(req.body, (dbResp) => {
      docId = dbResp;
    });
    res.json({ id: docId });
  });
};
