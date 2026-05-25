import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as { redis?: Redis };

function createRedisClient(): Redis {
  const client = new Redis({
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
  });

  client.on('error', (err) => console.error('[Redis] Error:', err));

  return client;
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}
