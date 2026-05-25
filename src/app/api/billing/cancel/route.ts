export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { requireCurrentUser } from '@/lib/auth/guard';
import { cancelSubscription, getUserTier } from '@/lib/subscription';

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const tier = await getUserTier(user.id);

    if (tier === 'FREE') {
      return apiSuccess({ message: 'No active subscription to cancel', tier: 'FREE' });
    }

    const { mock } = await cancelSubscription(user.id);
    return apiSuccess({
      mock,
      tier: 'FREE',
      message: mock
        ? 'Mock subscription cancelled'
        : 'Subscription cancelled — you are now on the Free plan',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
