import Redis, { type RedisOptions } from 'ioredis';

const g = globalThis as unknown as { redis?: Redis };

const COMMON_OPTIONS: RedisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  // Connect on first command rather than at import time so `next build`
  // doesn't open a socket to a database that isn't reachable.
  lazyConnect: true,
  keepAlive: 10_000,
  connectTimeout: 10_000,
  retryStrategy(times) {
    if (times > 10) return null;
    return Math.min(times * 150, 3_000);
  },
  reconnectOnError(err) {
    return err.message.includes('READONLY');
  },
};

function createRedisClient(): Redis {
  const url = process.env.REDIS_URL;

  const client = url
    ? new Redis(url, COMMON_OPTIONS)
    : new Redis({
        host: process.env.REDIS_HOST ?? 'localhost',
        port: Number(process.env.REDIS_PORT ?? 6379),
        password: process.env.REDIS_PASSWORD,
        ...COMMON_OPTIONS,
      });

  client.on('error', (err) => console.error('[Redis] Error:', err));
  client.on('reconnecting', () => console.warn('[Redis] Reconnecting...'));

  return client;
}

export const redis = g.redis ?? createRedisClient();

if (process.env.NODE_ENV !== 'production') g.redis = redis;
