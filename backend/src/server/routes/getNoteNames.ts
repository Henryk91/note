import { Router } from 'express';
import { noteController } from '../controllers/NoteController';
import { isAuthenticated } from '../middleware/auth';

const router = Router();

router.get('/', isAuthenticated, (req, res) => noteController.getNoteNames(req, res));

export default router;
