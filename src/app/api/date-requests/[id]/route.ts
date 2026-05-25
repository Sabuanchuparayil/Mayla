export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { parseBody } from '@/lib/api/validate';
import { requireCurrentUser } from '@/lib/auth/guard';
import { dateRequestRespondSchema } from '@/lib/validators/profile';
import { respondToDateRequest } from '@/lib/date-requests';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await requireCurrentUser(request);
    const { id } = await params;
    const body = parseBody(dateRequestRespondSchema, await request.json());
    const result = await respondToDateRequest(id, user.id, body.action);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
