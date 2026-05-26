import { ensureRedisConnected } from '@/lib/redis';
import type { CompatibilityResult } from '@/lib/compatibility';

const TTL_SECONDS = 3600;

export async function getCachedCompatibility(
  viewerId: string,
  candidateId: string,
  compute: () => CompatibilityResult,
): Promise<CompatibilityResult> {
  const redis = await ensureRedisConnected();
  const key = `compat:${viewerId}:${candidateId}`;
  const cached = await redis.get(key);
  if (cached) {
    try {
      return JSON.parse(cached) as CompatibilityResult;
    } catch {
      // fall through
    }
  }

  const result = compute();
  void redis.setex(key, TTL_SECONDS, JSON.stringify(result)).catch(() => undefined);
  return result;
}
