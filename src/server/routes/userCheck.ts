/* eslint-disable func-names */
const Handler = require('../controllers/handlers.js');

const dbHandler = new Handler();

module.exports = function (app) {
  app.post('/api-old/login', (req, res) => {
    console.log('Trying to log in');
    
    let docId = '';
    dbHandler.userLogin(req.body, (dbResp) => {
      docId = dbResp;
      console.log('Db Trying to log in res',dbResp);
      if (docId.indexOf('Login') < 0) {
        res.json({ id: docId });
      } else {
        res.json({ status: dbResp });
      }
    });
  });
  app.post('/api-old/register', (req, res) => {
    let docId = '';
    dbHandler.newUser(req.body, (dbResp) => {
      docId = dbResp;
    });
    res.json({ id: docId });
  });
};
