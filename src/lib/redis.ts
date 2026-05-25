import Redis from 'ioredis';

const g = globalThis as unknown as { redis?: Redis };

function createRedisClient(): Redis {
  const client = new Redis({
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: false,
    keepAlive: 10_000,
    connectTimeout: 10_000,
    retryStrategy(times) {
      if (times > 10) return null;
      return Math.min(times * 150, 3_000);
    },
    reconnectOnError(err) {
      return err.message.includes('READONLY');
    },
  });

  client.on('error', (err) => console.error('[Redis] Error:', err));
  client.on('reconnecting', () => console.warn('[Redis] Reconnecting...'));

  return client;
}

export const redis = g.redis ?? createRedisClient();

if (process.env.NODE_ENV !== 'production') g.redis = redis;
