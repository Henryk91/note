import { Application } from 'express';
import { noteController } from '../controllers/NoteController';

export default function updateNotes(app: Application) {
  app.post('/api/save', (req, res) => noteController.saveNote(req, res));

  app.post('/api/update', (req, res) => noteController.updateNote(req, res));

  app.post('/api/update-one', (req, res) => noteController.updateOneNote(req, res));

  app.get('/api/log*', (req, res) => noteController.siteLog(req, res));
}
