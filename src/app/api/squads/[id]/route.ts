export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { parseBody } from '@/lib/api/validate';
import { requireCurrentUser } from '@/lib/auth/guard';
import { disbandSquad, getSquadForUser, getSquadDiscoverFeed, updateSquad } from '@/lib/squad';
import { updateSquadSchema } from '@/lib/validators/referral';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const user = await requireCurrentUser(request);
    const { id } = await params;
    const url = new URL(request.url);
    const discover = url.searchParams.get('discover') === '1';

    if (discover) {
      const feed = await getSquadDiscoverFeed(user.id, id);
      return apiSuccess({ feed });
    }

    const squad = await getSquadForUser(id, user.id);
    return apiSuccess({ squad });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await requireCurrentUser(request);
    const { id } = await params;
    const body = parseBody(updateSquadSchema, await request.json());
    const squad = await updateSquad(user.id, id, body.name);
    return apiSuccess({ squad });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const user = await requireCurrentUser(request);
    const { id } = await params;
    const result = await disbandSquad(user.id, id);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
