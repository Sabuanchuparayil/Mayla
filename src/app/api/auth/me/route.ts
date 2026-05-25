export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { requireCurrentUser } from '@/lib/auth/guard';

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    return apiSuccess({ user });
  } catch (error) {
    return handleApiError(error);
  }
}
