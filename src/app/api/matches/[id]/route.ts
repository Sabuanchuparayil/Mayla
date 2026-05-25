export const dynamic = 'force-dynamic';

import { handleApiError, AppError, ErrorCodes } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { requireCurrentUser } from '@/lib/auth/guard';
import { getMatchForUser } from '@/lib/matches';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const user = await requireCurrentUser(request);
    const { id } = await params;
    const match = await getMatchForUser(id, user.id);

    if (!match) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Match not found', 404);
    }

    const other = match.userAId === user.id ? match.userB : match.userA;

    return apiSuccess({
      id: match.id,
      status: match.status,
      otherUser: {
        id: other.id,
        displayName: other.profile?.displayName ?? other.name ?? 'User',
        avatarUrl: other.avatarUrl,
        verified: other.verified,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
