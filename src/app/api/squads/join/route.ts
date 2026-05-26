export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { parseBody } from '@/lib/api/validate';
import { requireCurrentUser } from '@/lib/auth/guard';
import { joinSquadByCode } from '@/lib/squad';
import { joinSquadSchema } from '@/lib/validators/referral';

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const body = parseBody(joinSquadSchema, await request.json());
    const squad = await joinSquadByCode(user.id, body.code);
    return apiSuccess({ squad });
  } catch (error) {
    return handleApiError(error);
  }
}
