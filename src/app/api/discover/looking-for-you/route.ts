export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { requireCurrentUser } from '@/lib/auth/guard';
import { getLookingForYou } from '@/lib/looking-for-you';

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const data = await getLookingForYou(user.id);
    return apiSuccess(data);
  } catch (error) {
    return handleApiError(error);
  }
}
