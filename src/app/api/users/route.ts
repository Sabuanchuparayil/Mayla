export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess, toSafeUser } from '@/lib/api/response';
import { requireAdmin } from '@/lib/auth/guard';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const users = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return apiSuccess({ users: users.map(toSafeUser) });
  } catch (error) {
    return handleApiError(error);
  }
}
