export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { requireCurrentUser } from '@/lib/auth/guard';
import { ensureSubscription, getUserTier, tierFeatures } from '@/lib/subscription';
import { countSwipesToday } from '@/lib/discover';

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    await ensureSubscription(user.id);
    const tier = await getUserTier(user.id);
    const swipesUsedToday = await countSwipesToday(user.id);

    return apiSuccess({
      ...tierFeatures(tier),
      swipesUsedToday,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
