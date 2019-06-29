var express = require("express");
var router = express.Router();
var Handler = require('../controllers/handlers.js')

var dbHandler = new Handler();




router.get("/", function (req, res) {
  var user = req.query.user;

//   if(false){
//   dbHandler.getAllNotes((docs) => {
//     res.json(docs)
//   })
// }else {

  dbHandler.getMyNotes(user , (docs) => {
    res.json(docs)
  })
// }
  // res.json(noteDummy)
});

module.exports = router;