var Handler = require('../controllers/handlers.js');
var dbHandler = new Handler();

module.exports = function(app) {
  app.post('/api/login', function(req, res) {
    let docId = '';
    dbHandler.userLogin(req.body, dbResp => {
      docId = dbResp;

      if (docId.indexOf('Login') < 0) {
        res.json({ id: docId });
      }
    });
  });
  app.post('/api/register', function(req, res) {
    let docId = '';
    dbHandler.newUser(req.body, dbResp => {
      docId = dbResp;
    });
    res.json({ id: docId });
  });
};
