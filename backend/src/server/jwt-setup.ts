import { Application, NextFunction, Request, Response } from 'express';
import { expressjwt as jwtMiddleware } from 'express-jwt';
import jwt from 'jsonwebtoken';

import config from './config';

const JWT_ALG: jwt.Algorithm = 'HS256';

const jwtSetup = (app: Application) => {
  // ---- Protect API (reads access token from cookie) ----
  app.use(
    '/api',
    jwtMiddleware({
      secret: config.jwt.secret,
      algorithms: [JWT_ALG],
      getToken: (req) => req.cookies?.access_token || null,
      credentialsRequired: false,
    }),
  );

  // ---- Auth error handler for express-jwt ----
  app.use((err: Error & { name?: string }, _req: Request, res: Response, next: NextFunction) => {
    if (err.name === 'UnauthorizedError') {
      return res.status(401).json({ error: 'Invalid or missing access token' });
    }
    next(err);
  });
};

export default jwtSetup;
