export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { requireCurrentUser } from '@/lib/auth/guard';
import { getAppBaseUrl } from '@/lib/app-url';
import { buildInviteLink, buildWhatsAppShareText, getReferralStats } from '@/lib/referral';

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const stats = await getReferralStats(user.id);
    return apiSuccess({
      code: stats.code,
      inviteLink: stats.inviteLink,
      whatsAppText: stats.whatsAppText,
      whatsAppUrl: `https://wa.me/?text=${encodeURIComponent(stats.whatsAppText)}`,
      og: {
        title: 'Join Mayla — verified social discovery',
        description: `${stats.code} — invite-only access for expats in the Middle East`,
        url: buildInviteLink(stats.code),
        image: `${getAppBaseUrl()}/pwa-icons?size=512`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
