export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { requireAdmin } from '@/lib/auth/guard';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const url = new URL(request.url);
    const search = url.searchParams.get('q') ?? '';
    const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
    const limit = 20;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search } },
            { username: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          phone: true,
          name: true,
          username: true,
          role: true,
          verified: true,
          onboardingCompleted: true,
          suspendedAt: true,
          createdAt: true,
          lastLoginAt: true,
          referralCode: true,
          subscription: { select: { tier: true, status: true, expiresAt: true } },
          profile: { select: { displayName: true, gender: true, city: true, country: true } },
          _count: {
            select: {
              referralsMade: true,
              swipesFrom: true,
              matchesAsA: true,
              matchesAsB: true,
              reportsMade: true,
              reportsReceived: true,
              squadMemberships: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.user.count({ where }),
    ]);

    return apiSuccess({ users, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    return handleApiError(error);
  }
}
