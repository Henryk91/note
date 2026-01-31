import { Router } from 'express';
import { noteController } from '../controllers/NoteController';
import { isAuthenticated } from '../middleware/auth';

const router = Router();

router.get('/', isAuthenticated, (req, res) => noteController.getV2Content(req, res));
router.get('/with-children', isAuthenticated, (req, res) => noteController.getV2ContentWithChildren(req, res));
router.post('/', isAuthenticated, (req, res) => noteController.createV2(req, res));
router.put('/', isAuthenticated, (req, res) => noteController.updateV2(req, res));
router.delete('/', isAuthenticated, (req, res) => noteController.deleteV2(req, res));

export default router;
