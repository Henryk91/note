
require('dotenv').config()

const mongoose = require('mongoose')
mongoose.connect(process.env.DB, {useNewUrlParser: true});

var Schema = mongoose.Schema;

var noteSchema = new Schema({
    id: {type: String, required: true},
    createdBy: {type: String, required: true},
    heading: {type: String, required: true},
    // lastName: {type: String, required: true},
    dataLable: {type: Array},

});

var Note = mongoose.model('Notes', noteSchema);

module.exports = function () {

    this.newNote = (req, done) => {

        var note = req
        var createNote = new Note(note)

        createNote.save((err, data) => {
            if (err) {
                console.log(err)
                done(err.name)
            } else {

                done("Created");
            }
        })
    }

    this.getAllNotes = (done) => {
        Note.find({} , (err, docs) => {
            done(docs)
        })
    }

    this.getMyNotes = (req , done) => {
        Note.find({createdBy : req } , (err, docs) => {
            done(docs)
        })
    }

    this.updateNote = (req , done) => {

        console.log(req.person.id)
        let updateNoteId = req.person.id
        Note.findOne({id: updateNoteId} , (err, doc) => {
            if(err) console.log(err)
            let update = req.person;
            doc.heading = update.heading
            // doc.lastName = update.lastName
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
}