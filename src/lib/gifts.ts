import { db } from '@/lib/db';
import { AppError, ErrorCodes } from '@/lib/api/errors';
import { sendPushToUser } from '@/lib/push';

export type GiftType = 'ROSE' | 'COFFEE' | 'DINNER_INVITE' | 'WEEKEND_PACKAGE';

export const GIFT_CATALOG: {
  type: GiftType;
  label: string;
  icon: string;
  tier: 'FREE' | 'GOLD' | 'PLATINUM';
}[] = [
  { type: 'ROSE', label: 'Rose', icon: '🌹', tier: 'GOLD' },
  { type: 'COFFEE', label: 'Coffee', icon: '☕', tier: 'GOLD' },
  { type: 'DINNER_INVITE', label: 'Dinner Invite', icon: '🍽️', tier: 'PLATINUM' },
  { type: 'WEEKEND_PACKAGE', label: 'Weekend Package', icon: '✈️', tier: 'PLATINUM' },
];

export async function sendGift(
  fromUserId: string,
  toUserId: string,
  giftType: GiftType,
  message?: string,
) {
  if (fromUserId === toUserId) {
    throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Cannot send gift to yourself', 422);
  }

  const gift = await db.virtualGift.create({
    data: { fromUserId, toUserId, giftType, message: message ?? null },
    include: {
      fromUser: { select: { profile: { select: { displayName: true } } } },
    },
  });

  const catalogItem = GIFT_CATALOG.find((g) => g.type === giftType);
  void sendPushToUser(toUserId, {
    title: 'You received a gift',
    body: `${gift.fromUser.profile?.displayName ?? 'Someone'} sent you ${catalogItem?.icon ?? ''} ${catalogItem?.label ?? 'a gift'}`,
    url: '/gifts',
  });

  return gift;
}

export async function listReceivedGifts(userId: string) {
  return db.virtualGift.findMany({
    where: { toUserId: userId, status: { in: ['PENDING', 'SEEN'] } },
    include: {
      fromUser: { select: { id: true, profile: { select: { displayName: true, photos: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function respondToGift(giftId: string, userId: string, action: 'SEEN' | 'DECLINED') {
  const gift = await db.virtualGift.findUnique({ where: { id: giftId } });
  if (!gift || gift.toUserId !== userId) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Gift not found', 404);
  }
  return db.virtualGift.update({ where: { id: giftId }, data: { status: action } });
}
