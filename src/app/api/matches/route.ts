export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { requireCurrentUser } from '@/lib/auth/guard';
import { listUserMatches } from '@/lib/matches';

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const matches = await listUserMatches(user.id);
    return apiSuccess({ matches });
  } catch (error) {
    return handleApiError(error);
  }
}
