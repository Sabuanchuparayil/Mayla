export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { requireCurrentUser } from '@/lib/auth/guard';
import { getDailyPicks } from '@/lib/discover';

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit') ?? 10);
    const picks = await getDailyPicks(user.id, Math.min(limit, 10));
    return apiSuccess({ picks });
  } catch (error) {
    return handleApiError(error);
  }
}
