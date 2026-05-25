export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { requireCurrentUser } from '@/lib/auth/guard';
import { getLikesYou, likeBack } from '@/lib/likes-you';

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const data = await getLikesYou(user.id);
    return apiSuccess(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const body = (await request.json()) as { userId: string };
    const result = await likeBack(user.id, body.userId);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
