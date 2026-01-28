import { Application, Request, Response } from 'express';
import Handler from '../controllers/handlers';

const dbHandler = new Handler();

export default function updateNotes(app: Application) {
  app.post('/api/save', (req: Request, res: Response) => {
    req.body.userid = (req as any).auth?.sub;
    dbHandler.newNote(req.body, (dbResp) => res.json({ Ok: dbResp }));
  });

  app.post('/api/update', (req: Request, res: Response) => {
    req.body.userid = (req as any).auth?.sub;
    dbHandler.updateNote(req, (dbResp) => res.json({ Ok: dbResp }));
  });

  app.post('/api/update-one', (req: Request, res: Response) => {
    req.body.userid = (req as any).auth?.sub;
    dbHandler.updateOneNote(req, (dbResp) => {
      res.json({ Ok: dbResp });
    });
  });

  app.get('/api/log*', (req: Request, res: Response) => {
    dbHandler.updateSiteLog(req, (dbResp) => {
      console.log('req.headers', req.headers);
      console.log('Log response:', dbResp);
      res.json({ Ok: dbResp });
    });
  });
}
