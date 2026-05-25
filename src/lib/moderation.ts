import { db } from '@/lib/db';

export async function blockUser(blockerId: string, blockedId: string) {
  if (blockerId === blockedId) return;
  await db.userBlock.upsert({
    where: { blockerId_blockedId: { blockerId, blockedId } },
    create: { blockerId, blockedId },
    update: {},
  });
}

export async function reportUser(
  reporterId: string,
  reportedId: string,
  reason: string,
  details?: string,
) {
  return db.userReport.create({
    data: { reporterId, reportedId, reason, details },
  });
}

export async function listPendingReports(limit = 50) {
  return db.userReport.findMany({
    where: { status: 'PENDING' },
    include: {
      reporter: { select: { id: true, email: true, name: true } },
      reported: { select: { id: true, email: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
