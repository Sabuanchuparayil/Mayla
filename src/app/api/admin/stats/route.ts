export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { requireAdmin } from '@/lib/auth/guard';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const now = new Date();
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      verifiedUsers,
      onboardedUsers,
      newUsersToday,
      newUsersWeek,
      totalMatches,
      matchesWeek,
      totalSwipes,
      swipesToday,
      pendingReports,
      activeSubscriptions,
      goldSubs,
      platinumSubs,
      freeSubs,
      totalReferrals,
      completedReferrals,
      totalSquads,
      activeSquads,
      totalEvents,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { verified: true } }),
      db.user.count({ where: { onboardingCompleted: true } }),
      db.user.count({ where: { createdAt: { gte: dayAgo } } }),
      db.user.count({ where: { createdAt: { gte: weekAgo } } }),
      db.match.count({ where: { status: 'ACCEPTED' } }),
      db.match.count({ where: { status: 'ACCEPTED', createdAt: { gte: weekAgo } } }),
      db.swipe.count(),
      db.swipe.count({ where: { createdAt: { gte: dayAgo } } }),
      db.userReport.count({ where: { status: 'PENDING' } }),
      db.subscription.count({ where: { status: 'ACTIVE' } }),
      db.subscription.count({ where: { tier: 'GOLD', status: 'ACTIVE' } }),
      db.subscription.count({ where: { tier: 'PLATINUM', status: 'ACTIVE' } }),
      db.subscription.count({ where: { tier: 'FREE', status: 'ACTIVE' } }),
      db.referral.count(),
      db.referral.count({ where: { status: 'COMPLETED' } }),
      db.squad.count(),
      db.squad.count({ where: { isActive: true } }),
      db.communityEvent.count(),
    ]);

    return apiSuccess({
      users: { totalUsers, verifiedUsers, onboardedUsers, newUsersToday, newUsersWeek },
      engagement: { totalMatches, matchesWeek, totalSwipes, swipesToday },
      moderation: { pendingReports },
      revenue: { totalSubscriptions: activeSubscriptions, goldSubs, platinumSubs, freeUsers: freeSubs },
      growth: { totalReferrals, completedReferrals, conversionRate: totalReferrals > 0 ? Math.round((completedReferrals / totalReferrals) * 100) : 0 },
      community: { totalSquads, activeSquads, totalEvents },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
