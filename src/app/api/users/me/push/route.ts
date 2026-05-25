export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { parseBody } from '@/lib/api/validate';
import { requireCurrentUser } from '@/lib/auth/guard';
import { pushSubscribeSchema } from '@/lib/validators/profile';
import { savePushSubscription, removePushSubscription } from '@/lib/push';

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const body = parseBody(pushSubscribeSchema, await request.json());
    await savePushSubscription(user.id, body);
    return apiSuccess({ subscribed: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const body = (await request.json()) as { endpoint?: string };
    if (body.endpoint) await removePushSubscription(user.id, body.endpoint);
    return apiSuccess({ unsubscribed: true });
  } catch (error) {
    return handleApiError(error);
  }
}
