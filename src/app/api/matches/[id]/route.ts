export const dynamic = 'force-dynamic';

import { handleApiError, AppError, ErrorCodes } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { requireCurrentUser } from '@/lib/auth/guard';
import { getMatchForUser, getMatchChatContext } from '@/lib/matches';
import { unmatchUsers } from '@/lib/date-requests';

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
    const chatContext = await getMatchChatContext(id, user.id);

    return apiSuccess({
      id: match.id,
      status: match.status,
      otherUser: {
        id: other.id,
        displayName: other.profile?.displayName ?? other.name ?? 'User',
        avatarUrl: other.avatarUrl,
        verified: other.verified,
      },
      canSendMessage: chatContext?.canSendMessage ?? true,
      ladiesFirstHint: chatContext?.ladiesFirstHint ?? null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await requireCurrentUser(request);
    const { id } = await params;
    const body = (await request.json()) as { action?: string };

    if (body.action !== 'unmatch') {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Unsupported action', 422);
    }

    await unmatchUsers(user.id, id);
    return apiSuccess({ unmatched: true });
  } catch (error) {
    return handleApiError(error);
  }
}
