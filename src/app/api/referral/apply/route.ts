export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { parseBody } from '@/lib/api/validate';
import { requireCurrentUser } from '@/lib/auth/guard';
import { applyReferralCode } from '@/lib/referral';
import { referralCodeSchema } from '@/lib/validators/referral';

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const body = parseBody(referralCodeSchema, await request.json());
    const referral = await applyReferralCode(user.id, body.code);
    return apiSuccess({
      applied: true,
      code: referral.code,
      status: referral.status,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
