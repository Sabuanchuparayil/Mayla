export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { requireAdmin } from '@/lib/auth/guard';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
    const limit = 30;
    const skip = (page - 1) * limit;

    const [referrals, total, completedCount, pendingCount] = await Promise.all([
      db.referral.findMany({
        include: {
          referrer: { select: { id: true, name: true, email: true, referralCode: true } },
          referred: { select: { id: true, name: true, email: true, createdAt: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.referral.count(),
      db.referral.count({ where: { status: 'COMPLETED' } }),
      db.referral.count({ where: { status: 'PENDING' } }),
    ]);

    const topReferrers = await db.referral.groupBy({
      by: ['referrerId'],
      where: { status: 'COMPLETED' },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    const topReferrerIds = topReferrers.map((r) => r.referrerId);
    const topUsers = topReferrerIds.length > 0
      ? await db.user.findMany({
          where: { id: { in: topReferrerIds } },
          select: { id: true, name: true, email: true, referralCode: true, referralBadges: true },
        })
      : [];

    const leaderboard = topReferrers.map((r) => ({
      ...topUsers.find((u) => u.id === r.referrerId),
      completedCount: r._count.id,
    }));

    return apiSuccess({
      referrals,
      total,
      completedCount,
      pendingCount,
      page,
      totalPages: Math.ceil(total / limit),
      leaderboard,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
