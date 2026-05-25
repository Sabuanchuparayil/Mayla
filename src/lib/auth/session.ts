import { randomUUID } from 'crypto';
import { ensureRedisConnected } from '@/lib/redis';
import { REFRESH_TOKEN_TTL_SECONDS } from '@/lib/constants';

type StoredRefreshToken = {
  userId: string;
  familyId: string;
  createdAt: string;
};

function refreshKey(tokenId: string) {
  return `refresh:${tokenId}`;
}

function familyKey(familyId: string) {
  return `family:${familyId}`;
}

function userTokensKey(userId: string) {
  return `user_tokens:${userId}`;
}

export async function storeRefreshToken(
  tokenId: string,
  userId: string,
  familyId?: string,
): Promise<string> {
  const redis = await ensureRedisConnected();
  const fid = familyId ?? randomUUID();
  const data: StoredRefreshToken = { userId, familyId: fid, createdAt: new Date().toISOString() };

  const pipeline = redis.pipeline();
  pipeline.set(refreshKey(tokenId), JSON.stringify(data), 'EX', REFRESH_TOKEN_TTL_SECONDS);
  pipeline.sadd(familyKey(fid), tokenId);
  pipeline.expire(familyKey(fid), REFRESH_TOKEN_TTL_SECONDS);
  pipeline.sadd(userTokensKey(userId), tokenId);
  pipeline.expire(userTokensKey(userId), REFRESH_TOKEN_TTL_SECONDS);
  await pipeline.exec();

  return fid;
}

export async function getStoredRefreshToken(
  tokenId: string,
): Promise<StoredRefreshToken | null> {
  const redis = await ensureRedisConnected();
  const raw = await redis.get(refreshKey(tokenId));
  if (!raw) return null;
  return JSON.parse(raw) as StoredRefreshToken;
}

export async function getRefreshTokenUserId(tokenId: string): Promise<string | null> {
  const stored = await getStoredRefreshToken(tokenId);
  return stored?.userId ?? null;
}

export async function revokeRefreshToken(tokenId: string): Promise<void> {
  const redis = await ensureRedisConnected();
  await redis.del(refreshKey(tokenId));
}

export async function revokeTokenFamily(familyId: string): Promise<void> {
  const redis = await ensureRedisConnected();
  const members = await redis.smembers(familyKey(familyId));
  if (members.length > 0) {
    const pipeline = redis.pipeline();
    for (const tid of members) {
      pipeline.del(refreshKey(tid));
    }
    pipeline.del(familyKey(familyId));
    await pipeline.exec();
  }
}

export async function revokeAllUserRefreshTokens(userId: string): Promise<void> {
  const redis = await ensureRedisConnected();
  const tokenIds = await redis.smembers(userTokensKey(userId));
  if (tokenIds.length > 0) {
    const pipeline = redis.pipeline();
    for (const tid of tokenIds) {
      pipeline.del(refreshKey(tid));
    }
    pipeline.del(userTokensKey(userId));
    await pipeline.exec();
  }
}
