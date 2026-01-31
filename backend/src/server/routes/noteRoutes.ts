import { Router } from 'express';
import { noteController } from '../controllers/NoteController';
import { isAuthenticated } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validation';
import {
  CreateV2NoteSchema,
  UpdateV2NoteSchema,
  DeleteV2NoteSchema,
  UpdateNoteBodySchema,
  UpdateOneNoteBodySchema,
  V2ParentQuerySchema,
} from '../validation/schemas';

const router = Router();

router.get('/note/', isAuthenticated, noteController.getNotes);

router.get('/note-v2/', isAuthenticated, noteController.getV2Content);
router.get(
  '/note-v2/with-children',
  isAuthenticated,
  validateQuery(V2ParentQuerySchema),
  noteController.getV2ContentWithChildren,
);
router.post('/note-v2/', isAuthenticated, validateBody(CreateV2NoteSchema), noteController.createV2);
router.put('/note-v2/', isAuthenticated, validateBody(UpdateV2NoteSchema), noteController.updateV2);
router.delete('/note-v2/', isAuthenticated, validateBody(DeleteV2NoteSchema), noteController.deleteV2);

router.get('/note-names/', isAuthenticated, noteController.getNoteNames);

router.post('/save', isAuthenticated, noteController.saveNote);
router.post('/update', isAuthenticated, validateBody(UpdateNoteBodySchema), noteController.updateNote);
router.post('/update-one', isAuthenticated, validateBody(UpdateOneNoteBodySchema), noteController.updateOneNote);
router.get('/log*', noteController.siteLog);

export default router;
