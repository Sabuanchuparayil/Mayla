export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { parseBody } from '@/lib/api/validate';
import { requireCurrentUser } from '@/lib/auth/guard';
import { createCheckoutSession, mockUpgrade } from '@/lib/subscription';
import { checkoutSchema } from '@/lib/validators/profile';

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const body = parseBody(checkoutSchema, await request.json());

    const { checkoutUrl, mock } = await createCheckoutSession(
      user.id,
      body.tier,
      user.email,
    );

    if (mock || !checkoutUrl) {
      const sub = await mockUpgrade(user.id, body.tier);
      return apiSuccess({
        mock: true,
        checkoutUrl: null,
        tier: sub.tier,
        expiresAt: sub.expiresAt?.toISOString() ?? null,
        message: `Mock upgrade to ${body.tier} active for 30 days`,
      });
    }

    return apiSuccess({
      mock: false,
      checkoutUrl,
      tier: body.tier,
      message: 'Redirecting to Stripe Checkout',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
