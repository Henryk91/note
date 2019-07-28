var Handler = require('../controllers/handlers.js')
var dbHandler = new Handler();

module.exports = function (app) {

  app.post('/api/save', function (req, res) {
    dbHandler.newNote(req.body ,(dbResp) => res.json({ Ok: dbResp }))
  })
  app.post('/api/update', function (req, res) {
    
    dbHandler.updateNote(req,(dbResp) => res.json({ Ok: dbResp }))
    res.json({ Ok: '100' })
  })
};
