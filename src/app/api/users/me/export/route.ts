export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api/errors';
import { requireCurrentUser } from '@/lib/auth/guard';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const [profile, subscription, matches, swipes, auditLogs] = await Promise.all([
      db.profile.findUnique({ where: { userId: user.id } }),
      db.subscription.findUnique({ where: { userId: user.id } }),
      db.match.count({
        where: { OR: [{ userAId: user.id }, { userBId: user.id }], status: 'ACCEPTED' },
      }),
      db.swipe.count({ where: { fromUserId: user.id } }),
      db.auditLog.findMany({ where: { userId: user.id }, take: 100, orderBy: { createdAt: 'desc' } }),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      user,
      profile,
      subscription,
      stats: { matches, swipes },
      auditLogs,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="mayla-export-${user.id}.json"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
