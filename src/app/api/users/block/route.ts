export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { parseBody } from '@/lib/api/validate';
import { requireCurrentUser } from '@/lib/auth/guard';
import { blockUser } from '@/lib/moderation';
import { blockSchema } from '@/lib/validators/profile';

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const body = parseBody(blockSchema, await request.json());
    await blockUser(user.id, body.userId);
    return apiSuccess({ blocked: true });
  } catch (error) {
    return handleApiError(error);
  }
}
