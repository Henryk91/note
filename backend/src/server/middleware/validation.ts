import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { ValidationError } from '../utils/errors';

export const validateBody =
  <T>(schema: z.ZodSchema<T>) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors as Record<string, string[] | undefined>;
      const message = Object.entries(errors)
        .map(([field, msgs]) => `${field}: ${msgs?.join(', ')}`)
        .join('; ');
      throw new ValidationError(message);
    }
    req.body = result.data;
    next();
  };

export const validateQuery =
  <T>(schema: z.ZodSchema<T>) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors as Record<string, string[] | undefined>;
      const message = Object.entries(errors)
        .map(([field, msgs]) => `${field}: ${msgs?.join(', ')}`)
        .join('; ');
      throw new ValidationError(message);
    }
    req.query = result.data as any;
    next();
  };

// Keep backward compatibility
export const validate = validateBody;
