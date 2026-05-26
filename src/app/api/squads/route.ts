export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { parseBody } from '@/lib/api/validate';
import { requireCurrentUser } from '@/lib/auth/guard';
import { createSquad, listUserSquads } from '@/lib/squad';
import { createSquadSchema } from '@/lib/validators/referral';

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const squads = await listUserSquads(user.id);
    return apiSuccess({ squads });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const body = parseBody(createSquadSchema, await request.json());
    const squad = await createSquad(user.id, body.name);
    return apiSuccess({ squad });
  } catch (error) {
    return handleApiError(error);
  }
}
