export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { parseBody } from '@/lib/api/validate';
import { requireCurrentUser } from '@/lib/auth/guard';
import { getSquadForUser, joinSquadByCode } from '@/lib/squad';
import { joinSquadSchema } from '@/lib/validators/referral';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const user = await requireCurrentUser(request);
    const { id } = await params;
    const squad = await getSquadForUser(id, user.id);
    return apiSuccess({ squad });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireCurrentUser(request);
    const { id } = await params;
    const body = parseBody(joinSquadSchema, await request.json());
    const squad = await joinSquadByCode(user.id, body.code);
    if (squad.id !== id) {
      return apiSuccess({ squad, joinedDifferent: true });
    }
    return apiSuccess({ squad });
  } catch (error) {
    return handleApiError(error);
  }
}
