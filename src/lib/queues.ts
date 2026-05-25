import { Queue } from 'bullmq';
import { redis } from '@/lib/redis';

// BullMQ requires ioredis with maxRetriesPerRequest: null
// This is already set in src/lib/redis.ts
const connection = { ...redis.options };

export const selfieQueue = new Queue('selfie-verification', { connection });
export const photoQueue = new Queue('photo-matching', { connection });
