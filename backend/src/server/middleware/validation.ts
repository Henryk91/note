import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

export const validate =
  <T>(schema: z.ZodSchema<T>) =>
  (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
    }
    req.body = parsed.data as typeof req.body;
    return next();
  };
