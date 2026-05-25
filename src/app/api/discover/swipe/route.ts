export const dynamic = 'force-dynamic';

import { handleApiError, AppError, ErrorCodes } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { parseBody } from '@/lib/api/validate';
import { requireCurrentUser } from '@/lib/auth/guard';
import { recordSwipe } from '@/lib/discover';
import { emitToUser } from '@/lib/socket-io';
import { sendPushToUser } from '@/lib/push';
import { db } from '@/lib/db';
import { z } from 'zod';

const swipeSchema = z.object({
  targetUserId: z.string().min(1),
  action: z.enum(['LIKE', 'PASS']),
});

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const body = parseBody(swipeSchema, await request.json());

    let result;
    try {
      result = await recordSwipe(user.id, body.targetUserId, body.action);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Swipe failed';
      if (msg.includes('Daily swipe limit')) {
        throw new AppError(ErrorCodes.FORBIDDEN, msg, 403);
      }
      throw err;
    }

    if (result.matched && result.matchId) {
      emitToUser(body.targetUserId, 'match:new', {
        matchId: result.matchId,
        fromUserId: user.id,
      });

      const [senderProfile, targetProfile] = await Promise.all([
        db.profile.findUnique({ where: { userId: user.id }, select: { displayName: true } }),
        db.profile.findUnique({ where: { userId: body.targetUserId }, select: { displayName: true } }),
      ]);

      void sendPushToUser(body.targetUserId, {
        title: "It's a match!",
        body: `You matched with ${senderProfile?.displayName ?? 'someone new'}`,
        url: `/chat?match=${result.matchId}`,
      });
      void sendPushToUser(user.id, {
        title: "It's a match!",
        body: `You matched with ${targetProfile?.displayName ?? 'someone new'}`,
        url: `/chat?match=${result.matchId}`,
      });
    }

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
