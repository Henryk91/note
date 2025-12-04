import { Request, Response, Router } from 'express';
import Handler from '../controllers/handlers';

const router = Router();
const dbHandler = new Handler();

router.get('/', (req: Request, res: Response) => {
  dbHandler.getNoteV2Content(req, (docs) => {
    res.json(docs);
  });
});

router.get('/with-children', (req: Request, res: Response) => {
  dbHandler.getNoteV2ContentWithChildren(req, (docs) => {
    res.json(docs);
  });
});

router.post('/', (req: Request, res: Response) => {
  dbHandler.newV2Note(req, (docs) => {
    res.json(docs);
  });
  if (req.body.type === 'FOLDER') {
    req.body.content = {
      data: `href:${req.body.id}`,
      tag: `Sub: ${req.body.name}`,
    };
  }
  dbHandler.syncCreateV1Note(req, () => {
    console.log('Created Note V1');
  });
});

router.put('/', (req: Request, res: Response) => {
  dbHandler.updateV2Note(req, (docs) => {
    res.json(docs);
  });

  dbHandler.syncUpdateV1Note(req, () => {
    console.log('Updated Note V1');
  });
});

router.delete('/', (req: Request, res: Response) => {
  dbHandler.deleteV2Note(req, (docs) => {
    res.json(docs);
  });

  dbHandler.syncDeleteV1Note(req, () => {
    console.log('Deleted Note V1');
  });
});

export default router;
