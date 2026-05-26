import { ensureRedisConnected } from '@/lib/redis';
import { db } from '@/lib/db';

const PREFIX = 'gentleman:';

export async function recordMessageSent(userId: string, contentLength: number) {
  const redis = await ensureRedisConnected();
  const key = `${PREFIX}${userId}`;
  await redis.hincrby(key, 'messages', 1);
  if (contentLength >= 20) await redis.hincrby(key, 'qualityMessages', 1);
  await redis.expire(key, 90 * 86400);
}

export async function recordMessageReply(userId: string, replyDelayMs: number) {
  const redis = await ensureRedisConnected();
  const key = `${PREFIX}${userId}`;
  await redis.hincrby(key, 'replies', 1);
  if (replyDelayMs <= 4 * 60 * 60 * 1000) await redis.hincrby(key, 'fastReplies', 1);
  await redis.expire(key, 90 * 86400);
}

export async function recordReportAgainst(userId: string) {
  const redis = await ensureRedisConnected();
  const key = `${PREFIX}${userId}`;
  await redis.hincrby(key, 'reports', 1);
  await redis.expire(key, 90 * 86400);
}

export async function computeGentlemanScore(userId: string): Promise<number> {
  const redis = await ensureRedisConnected();
  const data = await redis.hgetall(`${PREFIX}${userId}`);
  const messages = Number(data.messages ?? 0);
  const qualityMessages = Number(data.qualityMessages ?? 0);
  const replies = Number(data.replies ?? 0);
  const fastReplies = Number(data.fastReplies ?? 0);
  const reports = Number(data.reports ?? 0);

  if (messages === 0) return 0;

  let score = 50;
  score += Math.min(25, Math.round((qualityMessages / messages) * 25));
  if (replies > 0) score += Math.min(20, Math.round((fastReplies / replies) * 20));
  score -= Math.min(30, reports * 10);
  return Math.max(0, Math.min(100, score));
}

export async function refreshGentlemanScore(userId: string): Promise<number> {
  const score = await computeGentlemanScore(userId);
  await db.profile.update({ where: { userId }, data: { gentlemanScore: score } });
  return score;
}

const refreshTimers = new Map<string, ReturnType<typeof setTimeout>>();

/** Debounced persist of Redis metrics to Profile.gentlemanScore. */
export function scheduleGentlemanScoreRefresh(userId: string): void {
  const existing = refreshTimers.get(userId);
  if (existing) clearTimeout(existing);
  refreshTimers.set(
    userId,
    setTimeout(() => {
      refreshTimers.delete(userId);
      void refreshGentlemanScore(userId).catch((err) => {
        console.error('[GentlemanScore] refresh failed:', err);
      });
    }, 2000),
  );
}

export function gentlemanStars(score: number): number {
  if (score >= 80) return 5;
  if (score >= 60) return 4;
  if (score >= 40) return 3;
  if (score >= 20) return 2;
  if (score > 0) return 1;
  return 0;
}
