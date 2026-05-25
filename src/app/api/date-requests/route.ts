export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { parseBody } from '@/lib/api/validate';
import { requireCurrentUser } from '@/lib/auth/guard';
import { dateRequestCreateSchema } from '@/lib/validators/profile';
import { createDateRequest, listDateRequests, countDateRequestsThisWeek } from '@/lib/date-requests';
import { getUserTier, tierFeatures } from '@/lib/subscription';

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const tier = await getUserTier(user.id);
    const features = tierFeatures(tier);
    const used = await countDateRequestsThisWeek(user.id);
    const { incoming, outgoing } = await listDateRequests(user.id);

    return apiSuccess({
      incoming,
      outgoing,
      quota: {
        used,
        limit: features.dateRequestsPerWeek,
        canSend: features.dateRequestsPerWeek !== 0,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const body = parseBody(dateRequestCreateSchema, await request.json());
    const request_ = await createDateRequest(user.id, body.toUserId, {
      message: body.message,
      proposedDay: body.proposedDay,
      proposedTime: body.proposedTime,
    });
    return apiSuccess({ request: request_ });
  } catch (error) {
    return handleApiError(error);
  }
}
