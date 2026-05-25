import { db } from '@/lib/db';
import { AppError, ErrorCodes } from '@/lib/api/errors';
import { getUserTier, tierFeatures } from '@/lib/subscription';
import { ensureRedisConnected } from '@/lib/redis';
import { sendPushToUser } from '@/lib/push';

function orderedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

function weekKey(userId: string): string {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  return `date_requests:${userId}:${start.toISOString().slice(0, 10)}`;
}

export async function countDateRequestsThisWeek(userId: string): Promise<number> {
  const redis = await ensureRedisConnected();
  const count = await redis.get(weekKey(userId));
  return count ? Number(count) : 0;
}

async function incrementDateRequestCount(userId: string): Promise<number> {
  const redis = await ensureRedisConnected();
  const key = weekKey(userId);
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 7 * 86400);
  return count;
}

export async function assertCanSendDateRequest(userId: string): Promise<void> {
  const tier = await getUserTier(userId);
  const features = tierFeatures(tier);
  if (features.dateRequestsPerWeek === 0) {
    throw new AppError(
      ErrorCodes.FORBIDDEN,
      'Upgrade to Gold to send Date Requests',
      403,
    );
  }
  if (features.dateRequestsPerWeek !== null) {
    const used = await countDateRequestsThisWeek(userId);
    if (used >= features.dateRequestsPerWeek) {
      throw new AppError(
        ErrorCodes.RATE_LIMITED,
        'Weekly Date Request limit reached. Upgrade to Platinum for unlimited.',
        429,
      );
    }
  }
}

export async function createDateRequest(
  fromUserId: string,
  toUserId: string,
  data: { message?: string; proposedDay?: string; proposedTime?: string },
) {
  if (fromUserId === toUserId) {
    throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Cannot send a request to yourself', 422);
  }

  const blockExists = await db.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: fromUserId, blockedId: toUserId },
        { blockerId: toUserId, blockedId: fromUserId },
      ],
    },
    select: { id: true },
  });
  if (blockExists) {
    throw new AppError(ErrorCodes.FORBIDDEN, 'Cannot interact with this user', 403);
  }

  await assertCanSendDateRequest(fromUserId);

  const existing = await db.dateRequest.findFirst({
    where: {
      fromUserId,
      toUserId,
      status: 'PENDING',
    },
  });
  if (existing) {
    throw new AppError(ErrorCodes.CONFLICT, 'You already have a pending request with this person', 409);
  }

  const request = await db.dateRequest.create({
    data: {
      fromUserId,
      toUserId,
      message: data.message ?? null,
      proposedDay: data.proposedDay ?? null,
      proposedTime: data.proposedTime ?? null,
    },
    include: {
      toUser: { select: { id: true, name: true, profile: { select: { displayName: true } } } },
    },
  });

  await incrementDateRequestCount(fromUserId);

  const fromProfile = await db.profile.findUnique({
    where: { userId: fromUserId },
    select: { displayName: true },
  });
  void sendPushToUser(toUserId, {
    title: 'Date request',
    body: `${fromProfile?.displayName ?? 'Someone'} wants to meet up`,
    url: '/discover',
  });

  return request;
}

export async function respondToDateRequest(
  requestId: string,
  userId: string,
  action: 'ACCEPT' | 'DECLINE',
) {
  const request = await db.dateRequest.findUnique({ where: { id: requestId } });
  if (!request || request.toUserId !== userId) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Date request not found', 404);
  }
  if (request.status !== 'PENDING') {
    throw new AppError(ErrorCodes.CONFLICT, 'This request has already been handled', 409);
  }

  if (action === 'DECLINE') {
    return db.dateRequest.update({
      where: { id: requestId },
      data: { status: 'DECLINED' },
    });
  }

  const [userAId, userBId] = orderedPair(request.fromUserId, request.toUserId);
  const match = await db.match.upsert({
    where: { userAId_userBId: { userAId, userBId } },
    create: { userAId, userBId, status: 'ACCEPTED' },
    update: { status: 'ACCEPTED' },
  });

  await db.swipe.upsert({
    where: { fromUserId_toUserId: { fromUserId: request.fromUserId, toUserId: request.toUserId } },
    create: { fromUserId: request.fromUserId, toUserId: request.toUserId, action: 'LIKE' },
    update: { action: 'LIKE' },
  });
  await db.swipe.upsert({
    where: { fromUserId_toUserId: { fromUserId: request.toUserId, toUserId: request.fromUserId } },
    create: { fromUserId: request.toUserId, toUserId: request.fromUserId, action: 'LIKE' },
    update: { action: 'LIKE' },
  });

  const updated = await db.dateRequest.update({
    where: { id: requestId },
    data: { status: 'ACCEPTED' },
  });

  return { request: updated, matchId: match.id };
}

export async function listDateRequests(userId: string) {
  const [incoming, outgoing] = await Promise.all([
    db.dateRequest.findMany({
      where: { toUserId: userId, status: { in: ['PENDING', 'ACCEPTED'] } },
      include: {
        fromUser: {
          select: {
            id: true,
            verified: true,
            profile: { select: { displayName: true, photos: true, city: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.dateRequest.findMany({
      where: { fromUserId: userId },
      include: {
        toUser: {
          select: {
            id: true,
            verified: true,
            profile: { select: { displayName: true, photos: true, city: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);

  return { incoming, outgoing };
}

export async function unmatchUsers(userId: string, matchId: string) {
  const match = await db.match.findFirst({
    where: {
      id: matchId,
      OR: [{ userAId: userId }, { userBId: userId }],
    },
  });
  if (!match) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Match not found', 404);
  }
  if (match.status !== 'ACCEPTED') {
    throw new AppError(ErrorCodes.CONFLICT, 'This match is not active', 409);
  }

  return db.match.update({
    where: { id: matchId },
    data: { status: 'REJECTED' },
  });
}
