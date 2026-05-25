export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { requireCurrentUser } from '@/lib/auth/guard';
import { countSwipesToday } from '@/lib/discover';
import { listUserMatches } from '@/lib/matches';
import { getUserTier } from '@/lib/subscription';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const [tier, swipesToday, matches, profileViews] = await Promise.all([
      getUserTier(user.id),
      countSwipesToday(user.id),
      listUserMatches(user.id),
      db.swipe.count({ where: { toUserId: user.id, action: 'LIKE' } }),
    ]);

    const acceptedMatches = matches.filter((m) => m.status === 'ACCEPTED').length;

    return apiSuccess({
      tier,
      swipesToday,
      totalMatches: acceptedMatches,
      likesReceived: profileViews,
      responseRate: acceptedMatches > 0 ? Math.min(100, acceptedMatches * 10) : 0,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
