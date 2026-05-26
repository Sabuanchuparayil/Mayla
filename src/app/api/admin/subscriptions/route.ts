export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { requireAdmin } from '@/lib/auth/guard';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const url = new URL(request.url);
    const tier = url.searchParams.get('tier') ?? undefined;
    const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
    const limit = 20;
    const skip = (page - 1) * limit;

    const where = tier ? { tier: tier as 'FREE' | 'GOLD' | 'PLATINUM' } : {};

    const [subscriptions, total, tierCounts] = await Promise.all([
      db.subscription.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, name: true, phone: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      db.subscription.count({ where }),
      db.subscription.groupBy({
        by: ['tier'],
        _count: { id: true },
      }),
    ]);

    const counts = Object.fromEntries(tierCounts.map((t) => [t.tier, t._count.id]));

    return apiSuccess({
      subscriptions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      tierCounts: {
        FREE: counts['FREE'] ?? 0,
        GOLD: counts['GOLD'] ?? 0,
        PLATINUM: counts['PLATINUM'] ?? 0,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
