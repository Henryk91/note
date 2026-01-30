import { Router } from 'express';
import { noteController } from '../controllers/NoteController';

const router = Router();

router.get('/', (req, res) => noteController.getV2Content(req, res));

router.get('/with-children', (req, res) => noteController.getV2ContentWithChildren(req, res));

router.post('/', (req, res) => noteController.createV2(req, res));

router.put('/', (req, res) => noteController.updateV2(req, res));

router.delete('/', (req, res) => noteController.deleteV2(req, res));

export default router;
