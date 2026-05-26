export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { requireAdmin } from '@/lib/auth/guard';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
    const limit = 20;
    const skip = (page - 1) * limit;

    const [squads, total] = await Promise.all([
      db.squad.findMany({
        include: {
          owner: { select: { id: true, name: true, email: true } },
          _count: { select: { members: true, vouches: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.squad.count(),
    ]);

    const activeSquads = await db.squad.count({ where: { isActive: true } });

    return apiSuccess({
      squads,
      total,
      activeSquads,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
