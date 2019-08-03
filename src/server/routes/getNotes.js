var express = require("express");
var router = express.Router();
var Handler = require('../controllers/handlers.js')

var dbHandler = new Handler();




router.get('/', function (req, res) {
  
  var user = req.query.user;
  if(user === 'all' || user === 'All'){
  dbHandler.getAllNotes(req, (docs) => {
    res.json(docs)
  })
} else {
  var noteHeading = req.query.noteHeading;
  if(noteHeading){
    
    dbHandler.getNote(req , (docs) => {
    res.json(docs)
  })
  }else {
    dbHandler.getMyNotes(req , (docs) => {
    res.json(docs)
  })
  }
  
}
  // res.json(noteDummy)
});

module.exports = router;