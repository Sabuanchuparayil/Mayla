import { Queue } from 'bullmq';
import { redis } from '@/lib/redis';

// BullMQ requires ioredis with maxRetriesPerRequest: null (set in src/lib/redis.ts).
function connection() {
  return { ...redis.options };
}

type QueueGlobal = { selfieQueue?: Queue; photoQueue?: Queue };
const g = globalThis as unknown as QueueGlobal;

// Lazily construct each Queue on first use. A BullMQ Queue opens a Redis
// connection as soon as it's instantiated, so building them at import time
// would make `next build` (and a cold server boot) hammer Redis before any
// job is ever enqueued.
function lazyQueue(key: keyof QueueGlobal, name: string): Queue {
  return new Proxy({} as Queue, {
    get(_target, prop, receiver) {
      g[key] ??= new Queue(name, { connection: connection() });
      const q = g[key]!;
      const value = Reflect.get(q, prop, receiver);
      return typeof value === 'function' ? value.bind(q) : value;
    },
  }) as Queue;
}

export const selfieQueue = lazyQueue('selfieQueue', 'selfie-verification');
export const photoQueue = lazyQueue('photoQueue', 'photo-matching');
