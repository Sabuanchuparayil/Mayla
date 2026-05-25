import { AppError, ErrorCodes } from '@/lib/api/errors';
import { ensureRedisConnected } from '@/lib/redis';

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ remaining: number; resetAt: number }> {
  const redis = await ensureRedisConnected();
  const now = Date.now();
  const windowKey = `ratelimit:${key}:${Math.floor(now / (windowSeconds * 1000))}`;

  const count = await redis.incr(windowKey);
  if (count === 1) {
    await redis.expire(windowKey, windowSeconds);
  }

  if (count > limit) {
    throw new AppError(
      ErrorCodes.RATE_LIMITED,
      'Too many requests. Please try again later.',
      429,
      { retryAfterSeconds: windowSeconds },
    );
  }

  return {
    remaining: Math.max(0, limit - count),
    resetAt: Math.ceil(now / (windowSeconds * 1000)) * windowSeconds * 1000,
  };
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}
