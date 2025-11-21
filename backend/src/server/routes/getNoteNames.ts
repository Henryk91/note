import { Request, Response, Router } from 'express';
import Handler from '../controllers/handlers';

const router = Router();
const dbHandler = new Handler();

router.get('/', (req: Request, res: Response) => {
  dbHandler.getNoteNames(req, (docs) => {
    res.json(docs);
  });
});

export default router;
