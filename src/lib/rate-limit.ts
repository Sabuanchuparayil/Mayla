import { redis } from '@/lib/redis';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // Unix ms
  total: number;
}

/**
 * Sliding window rate limiter backed by a Redis sorted set.
 * Each member is the request timestamp; expired members are pruned on every call.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = now - windowMs;
  const redisKey = `rl:${key}`;

  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(redisKey, 0, windowStart);
  pipeline.zcard(redisKey);
  pipeline.zadd(redisKey, now, `${now}:${Math.random().toString(36).slice(2)}`);
  pipeline.pexpire(redisKey, windowMs);
  const results = await pipeline.exec();

  const countBefore = (results?.[1]?.[1] as number) ?? 0;
  const allowed = countBefore < limit;
  const remaining = Math.max(0, limit - countBefore - (allowed ? 1 : 0));

  return { allowed, remaining, resetAt: now + windowMs, total: limit };
}

// ─── Pre-configured limiters ────────────────────────────────────────────────────────────────────

/** 100 requests / minute per IP */
export const apiLimiter = (ip: string) => rateLimit(`api:${ip}`, 100, 60_000);

/** 10 auth attempts / minute per IP */
export const authLimiter = (ip: string) => rateLimit(`auth:${ip}`, 10, 60_000);

/** 3 OTP requests / hour per identifier (phone or email) */
export const otpRequestLimiter = (identifier: string) =>
  rateLimit(`otp_req:${identifier}`, 3, 3_600_000);
