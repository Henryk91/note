import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import config from '../config';

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  // Handle known operational errors
  if (err instanceof AppError) {
    logger.warn(
      {
        err,
        statusCode: err.statusCode,
        url: req.url,
        method: req.method,
        userId: req.auth?.userId,
      },
      'Operational error',
    );

    return res.status(err.statusCode).json({
      error: err.message,
      ...(config.isProd ? {} : { stack: err.stack }),
    });
  }

  // Handle unexpected errors
  logger.error(
    {
      err,
      url: req.url,
      method: req.method,
      body: req.body,
      userId: req.auth?.userId,
    },
    'Unexpected error',
  );

  return res.status(500).json({
    error: 'Internal server error',
    ...(config.isProd ? {} : { message: err.message, stack: err.stack }),
  });
};

// Async handler wrapper to catch promise rejections
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
