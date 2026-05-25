export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { parseBody } from '@/lib/api/validate';
import { requireCurrentUser } from '@/lib/auth/guard';
import { giftSendSchema } from '@/lib/validators/profile';
import { GIFT_CATALOG, listReceivedGifts, sendGift } from '@/lib/gifts';
import { getUserTier, tierFeatures } from '@/lib/subscription';
import { AppError, ErrorCodes } from '@/lib/api/errors';

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const gifts = await listReceivedGifts(user.id);
    return apiSuccess({ gifts, catalog: GIFT_CATALOG });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const tier = await getUserTier(user.id);
    if (!tierFeatures(tier).canSendGifts) {
      throw new AppError(ErrorCodes.FORBIDDEN, 'Upgrade to Gold to send gifts', 403);
    }
    const body = parseBody(giftSendSchema, await request.json());
    const gift = await sendGift(user.id, body.toUserId, body.giftType, body.message);
    return apiSuccess({ gift });
  } catch (error) {
    return handleApiError(error);
  }
}
