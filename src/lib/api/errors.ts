import { ZodError } from 'zod';
import { apiError } from './response';

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number = 400,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    return apiError(error.code, error.message, error.status, error.details);
  }

  if (error instanceof ZodError) {
    return apiError(
      ErrorCodes.VALIDATION_ERROR,
      'Validation failed',
      422,
      error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    );
  }

  console.error('[API Error]', error);
  return apiError(ErrorCodes.INTERNAL_ERROR, 'An unexpected error occurred', 500);
}
