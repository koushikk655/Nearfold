import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { ValidationError } from '../utils/errors.js';

type Source = 'body' | 'query' | 'params';

/**
 * Generic Zod-backed request validator. Parses the chosen request source
 * and (on success) replaces it with the parsed (and coerced) data.
 */
export const validate =
  <T>(schema: ZodSchema<T>, source: Source = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(
        new ValidationError(`Invalid ${source}`, {
          issues: result.error.issues.map((i) => ({
            path: i.path.join('.'),
            message: i.message,
            code: i.code,
          })),
        }),
      );
    }
    // For query/params, Express's typings make the assignment awkward; cast safely.
    (req as unknown as Record<Source, unknown>)[source] = result.data;
    next();
  };
