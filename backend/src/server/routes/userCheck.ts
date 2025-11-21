import { Application, Request, Response } from 'express';
import Handler from '../controllers/handlers';

const dbHandler = new Handler();

export default function userCheck(app: Application) {
  app.post('/api-old/login', (req: Request, res: Response) => {
    console.log('Trying to log in');

    dbHandler.userLogin(req.body, (dbResp) => {
      const docId = dbResp;
      console.log('Db Trying to log in res', dbResp);
      if (typeof docId === 'string' && docId.indexOf('Login') < 0) {
        res.json({ id: docId });
      } else {
        res.json({ status: dbResp });
      }
    });
  });

  app.post('/api-old/register', (req: Request, res: Response) => {
    dbHandler.newUser(req.body, (dbResp) => {
      res.json({ id: dbResp });
    });
  });
}
