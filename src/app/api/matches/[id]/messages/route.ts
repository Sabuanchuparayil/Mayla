export const dynamic = 'force-dynamic';

import { handleApiError, AppError, ErrorCodes } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { requireCurrentUser } from '@/lib/auth/guard';
import { userCanAccessMatch } from '@/lib/matches';
import { listMatchMessages, markMessagesRead } from '@/lib/messages';
import { emitToMatch } from '@/lib/socket-io';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const user = await requireCurrentUser(request);
    const { id: matchId } = await params;

    if (!(await userCanAccessMatch(matchId, user.id))) {
      throw new AppError(ErrorCodes.FORBIDDEN, 'Match not accessible', 403);
    }

    const { searchParams } = new URL(request.url);
    const before = searchParams.get('before') ?? undefined;
    const messages = await listMatchMessages(matchId, 50, before);

    return apiSuccess({ messages });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await requireCurrentUser(request);
    const { id: matchId } = await params;

    if (!(await userCanAccessMatch(matchId, user.id))) {
      throw new AppError(ErrorCodes.FORBIDDEN, 'Match not accessible', 403);
    }

    await markMessagesRead(matchId, user.id);
    emitToMatch(matchId, 'messages:read', { matchId, readerId: user.id });
    return apiSuccess({ read: true });
  } catch (error) {
    return handleApiError(error);
  }
}
