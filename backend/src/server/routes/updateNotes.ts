import { Router } from 'express';
import { noteController } from '../controllers/NoteController';
import { isAuthenticated } from '../middleware/auth';

const router = Router();

router.post('/save', isAuthenticated, (req, res) => noteController.saveNote(req, res));
router.post('/update', isAuthenticated, (req, res) => noteController.updateNote(req, res));
router.post('/update-one', isAuthenticated, (req, res) => noteController.updateOneNote(req, res));
router.get('/log*', (req, res) => noteController.siteLog(req, res));

export default router;
