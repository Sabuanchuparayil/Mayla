export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { db } from '@/lib/db';
import { resolveReferrerByCode } from '@/lib/referral';
import { buildInviteLink } from '@/lib/referral';

type Params = { params: Promise<{ code: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { code } = await params;
    const referrer = await resolveReferrerByCode(code);
    if (referrer) {
      const name = referrer.profile?.displayName ?? referrer.name ?? 'A friend';
      return apiSuccess({
        type: 'referral' as const,
        code: code.toUpperCase(),
        referrerName: name.split(' ')[0],
        inviteLink: buildInviteLink(code),
        title: `${name.split(' ')[0]} invited you to Mayla`,
        description: 'Verified social discovery for expats and travelers in the Middle East.',
      });
    }

    const squad = await db.squad.findFirst({
      where: { code: code.toUpperCase(), isActive: true },
      select: { name: true, code: true, _count: { select: { members: true } } },
    });
    if (squad) {
      return apiSuccess({
        type: 'squad' as const,
        code: squad.code,
        squadName: squad.name,
        memberCount: squad._count.members,
        inviteLink: buildInviteLink(squad.code),
        title: `Join ${squad.name} on Mayla`,
        description: 'Private squad for verified friends — discover together.',
      });
    }

    return apiSuccess({ type: 'unknown' as const, code: code.toUpperCase() });
  } catch (error) {
    return handleApiError(error);
  }
}
