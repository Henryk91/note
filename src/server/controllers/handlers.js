
require('dotenv').config()

const mongoose = require('mongoose')
mongoose.connect(process.env.DB, {useNewUrlParser: true});

var Schema = mongoose.Schema;

var noteSchema = new Schema({
    id: {type: String, required: true},
    userId: {type: String, required: true},
    createdBy: {type: String, required: true},
    heading: {type: String, required: true},
    // lastName: {type: String, required: true},
    dataLable: {type: Array},

});

var noteUserSchema = new Schema({
    email: {type: String, required: true},
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    password: {type: String, required: true},
    tempPass: {type: String, required: true},
    permId: {type: String, required: true},
});

var Note = mongoose.model('Notes', noteSchema);
var noteUser = mongoose.model('NoteUsers', noteUserSchema);

module.exports = function () {
    this.docId = (count) => {
          let text = '';
          const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
          for (let i = 0; i < count; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
          }
          return text;
        }
    
    function onlyUnique(value, index, self) { 
        return self.indexOf(value) === index;
    }
  
    this.newUser = (req, done) => {
         
        var user = req
        var docId = this.docId(10);
        var permId = this.docId(20);
      
        user.tempPass = docId;
        user.permId = docId;
        var createUser = new noteUser(user)

        createUser.save((err, data) => {
            if (err) {
                console.log(err)
                done(err.name)
            } else {
              
            }
        })
        done(docId);
    }

    this.newNote = (req, done) => {

        var note = req

      noteUser.find({tempPass : req.userId } , (err, docs) => {
        
        if(docs[0]){
            permId = docs[0].permId
            
            note.userId = docs[0].permId
          
          var createNote = new Note(note)

            createNote.save((err, data) => {
                if (err) {
                    console.log(err)
                    done(err.name)
                } else {

                    done("Created");
                }
            })
        } else {
          done("Temp Pass fail");
        }
        })
    }

    this.getAllNotes = (req, done) => {
     
      var pass = req.query.tempPass;
      var permId = null
      
      noteUser.find({tempPass : pass } , (err, docs) => {

          if(docs[0]){
            permId = docs[0].permId
      
            
        Note.find({userId: permId} , (err, docs) => {
            if(err) {
              console.log(err) 
              done("No notes") 
            }
              done(docs)
          })  
            } else {
            
            done("Logout User")
          }
        })
    }
    
    this.userLogin = (req , done) => {
        noteUser.findOne({email : req.email, password: req.password} , (err, docs) => {
          
          
          if(docs.password === req.password){
            
            var newTemp = this.docId(10)
            docs.tempPass = newTemp;
            
            docs.save(function (err) {
                if (err) {
                    console.log(err);
                    done('Save Fail')
                } 
                done(newTemp)
            })
            
            
          } else {
            done("Login Error")
          }
            
        })
    }

    this.getMyNotes = (req , done) => {
      var user = req.query.user;
      var pass = req.query.tempPass;
      var permId = null
      
      noteUser.find({tempPass : pass } , (err, docs) => {

          if(docs[0]){
            permId = docs[0].permId

          Note.find({createdBy : user, userId: permId } , (err, docs) => {

            if(err) {
              console.log(err) 
              done("No notes") 
            }
            docs = docs.map(doc => {
              
              return {createdBy: doc.createdBy, dataLable: doc.dataLable, heading: doc.heading, id: doc.id};
            })
              
              done(docs)
          })  
            } else {
            
            done("Logout User")
          }
        })
    }
    
    this.getNoteNames = (req , done ) => {
      
      var pass = req.query.tempPass;
      var permId = null
      
      noteUser.find({tempPass : pass } , (err, docs) => {

          if(docs[0]){
            permId = docs[0].permId
      
            
        Note.find({userId: permId} , (err, docs) => {
            if(err) {
              console.log(err) 
              done("No notes") 
            }
            let nameArray = docs.map(doc => doc = doc.createdBy)
            
            var unique = nameArray.filter( onlyUnique );
              done(unique)
          })  
            } else {
            
            done("Logout User")
          }
        })
      
    }

    this.updateNote = (req , done) => {

        console.log(req.query.tempPass)
        console.log(req.body.person.id)
        let updateNoteId = req.body.person.id
        
        
        var pass = req.query.tempPass;
      var permId = null
      
      noteUser.find({tempPass : pass } , (err, docs) => {

          if(docs[0]){
            permId = docs[0].permId
            
        Note.findOne({id: updateNoteId, userId: permId} , (err, doc) => {
            if(err) console.log(err)
            let update = req.body.person;
            doc.heading = update.heading
            doc.dataLable = update.dataLable
            doc.save(function (err) {
                if (err) {
                    console.log(err);
                    done('success')
                } 
                
            })
        })
        
      
        done
          }
      })
    }
}

