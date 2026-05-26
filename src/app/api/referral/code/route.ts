export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { parseBody } from '@/lib/api/validate';
import { requireCurrentUser } from '@/lib/auth/guard';
import { customizeReferralCode, getReferralStats, ensureReferralCode } from '@/lib/referral';
import { customizeReferralCodeSchema } from '@/lib/validators/referral';

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const stats = await getReferralStats(user.id);
    return apiSuccess(stats);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const body = parseBody(customizeReferralCodeSchema, await request.json());
    const code = await customizeReferralCode(user.id, body.code);
    const stats = await getReferralStats(user.id);
    return apiSuccess(stats);
  } catch (error) {
    return handleApiError(error);
  }
}

/** Ensure code exists for legacy users */
export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const code = await ensureReferralCode(user.id);
    return apiSuccess({ code });
  } catch (error) {
    return handleApiError(error);
  }
}
