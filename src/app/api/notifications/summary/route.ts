export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { requireCurrentUser } from '@/lib/auth/guard';
import { getAcceptedMatchIds } from '@/lib/matches';
import { countUnreadMessages } from '@/lib/messages';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const matchIds = await getAcceptedMatchIds(user.id);
    const unreadMessages = await countUnreadMessages(user.id, matchIds);

    const [pendingLikes, pendingDateRequests] = await Promise.all([
      db.swipe.count({
        where: { toUserId: user.id, action: 'LIKE' },
      }),
      db.dateRequest.count({
        where: { toUserId: user.id, status: 'PENDING' },
      }),
    ]);

    const items: {
      type: string;
      title: string;
      body: string;
      href: string;
    }[] = [];

    if (unreadMessages > 0) {
      items.push({
        type: 'message',
        title: 'Unread messages',
        body: `${unreadMessages} new message${unreadMessages === 1 ? '' : 's'}`,
        href: '/chat',
      });
    }
    if (pendingLikes > 0) {
      items.push({
        type: 'like',
        title: 'Likes You',
        body: `${pendingLikes} people liked you`,
        href: '/discover',
      });
    }
    if (pendingDateRequests > 0) {
      items.push({
        type: 'date',
        title: 'Date requests',
        body: `${pendingDateRequests} pending request${pendingDateRequests === 1 ? '' : 's'}`,
        href: '/discover',
      });
    }

    return apiSuccess({
      unreadMessages,
      pendingLikes,
      pendingDateRequests,
      total: unreadMessages + pendingLikes + pendingDateRequests,
      items,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
