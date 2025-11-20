import { Request, Response, Router } from 'express';
import Handler from '../controllers/handlers';

const router = Router();
const dbHandler = new Handler();

router.get('/', (req: Request, res: Response) => {
  const { user } = req.query as { user?: string };
  const decodedUser = user ? decodeURI(user) : '';
  if (decodedUser.toLowerCase() === 'all') {
    dbHandler.getAllNotes(req, (docs) => {
      res.json(docs);
    });
  } else {
    const { noteHeading } = req.query as { noteHeading?: string };
    const decodedNoteHeading = noteHeading ? decodeURI(noteHeading) : '';

    if (noteHeading) {
      console.log('Trying to getNote', decodedNoteHeading);
      dbHandler.getNote(req, (docs) => {
        res.json(docs);
      });
    } else {
      dbHandler.getMyNotes(req, (docs) => {
        console.log('Responding with docs');
        res.json(docs);
      });
    }
  }
});

export default router;
