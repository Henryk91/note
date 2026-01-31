import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/models';

/**
 * Middleware to ensure the request is authenticated by express-jwt.
 * Guarantees that req.auth exists and contains the user sub (ID).
 */
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  const { auth } = req;
  if (!auth || !auth.sub) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  auth.userId = auth.sub;
  next();
};

/**
 * Typed version of Request for use in controllers that require authentication.
 */
export type { AuthenticatedRequest };
