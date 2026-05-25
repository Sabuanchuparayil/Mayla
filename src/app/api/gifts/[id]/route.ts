export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { parseBody } from '@/lib/api/validate';
import { requireCurrentUser } from '@/lib/auth/guard';
import { giftRespondSchema } from '@/lib/validators/profile';
import { respondToGift } from '@/lib/gifts';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await requireCurrentUser(request);
    const { id } = await params;
    const body = parseBody(giftRespondSchema, await request.json());
    const gift = await respondToGift(id, user.id, body.action);
    return apiSuccess({ gift });
  } catch (error) {
    return handleApiError(error);
  }
}
