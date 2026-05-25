export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { parseBody } from '@/lib/api/validate';
import { requireCurrentUser } from '@/lib/auth/guard';
import { mockUpgrade } from '@/lib/subscription';
import { checkoutSchema } from '@/lib/validators/profile';

/** Mock checkout — upgrades tier instantly (no real Stripe charge). */
export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const body = parseBody(checkoutSchema, await request.json());

    const sub = await mockUpgrade(user.id, body.tier);

    return apiSuccess({
      mock: true,
      checkoutUrl: null,
      tier: sub.tier,
      expiresAt: sub.expiresAt?.toISOString() ?? null,
      message: `Mock upgrade to ${body.tier} active for 30 days`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
