import { z } from 'zod';
import { AppError, ErrorCodes } from './errors';

export function parseBody<T extends z.ZodType>(schema: T, body: unknown): z.infer<T> {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new AppError(
      ErrorCodes.VALIDATION_ERROR,
      'Validation failed',
      422,
      result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    );
  }
  return result.data;
}
