import { Router } from 'express';
import { noteController } from '../controllers/NoteController';
import { isAuthenticated } from '../middleware/auth';

const router = Router();

router.get('/note/', isAuthenticated, (req, res) => noteController.getNotes(req, res));

router.get('/note-v2/', isAuthenticated, (req, res) => noteController.getV2Content(req, res));
router.get('/note-v2/with-children', isAuthenticated, (req, res) => noteController.getV2ContentWithChildren(req, res));
router.post('/note-v2/', isAuthenticated, (req, res) => noteController.createV2(req, res));
router.put('/note-v2/', isAuthenticated, (req, res) => noteController.updateV2(req, res));
router.delete('/note-v2/', isAuthenticated, (req, res) => noteController.deleteV2(req, res));

router.get('/note-names/', isAuthenticated, (req, res) => noteController.getNoteNames(req, res));

router.post('/save', isAuthenticated, (req, res) => noteController.saveNote(req, res));
router.post('/update', isAuthenticated, (req, res) => noteController.updateNote(req, res));
router.post('/update-one', isAuthenticated, (req, res) => noteController.updateOneNote(req, res));
router.get('/log*', (req, res) => noteController.siteLog(req, res));

export default router;
