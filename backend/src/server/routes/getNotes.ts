import { Router } from 'express';
import { noteController } from '../controllers/NoteController';

const router = Router();

router.get('/', (req, res) => noteController.getNotes(req, res));

export default router;
