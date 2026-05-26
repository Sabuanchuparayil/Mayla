export const dynamic = 'force-dynamic';

import { handleApiError, AppError, ErrorCodes } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { parseBody } from '@/lib/api/validate';
import { requireAdmin } from '@/lib/auth/guard';
import { db } from '@/lib/db';
import { z } from 'zod';

const userUpdateSchema = z.object({
  role: z.enum(['USER', 'ADMIN']).optional(),
  verified: z.boolean().optional(),
  onboardingCompleted: z.boolean().optional(),
  suspended: z.boolean().optional(),
  unsuspend: z.boolean().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    const user = await db.user.findUnique({
      where: { id },
      include: {
        profile: true,
        subscription: true,
        preference: true,
        referralsMade: {
          include: { referred: { select: { name: true, email: true, createdAt: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        referredBy: {
          include: { referrer: { select: { name: true, email: true, referralCode: true } } },
        },
        squadMemberships: {
          include: { squad: { select: { id: true, name: true, code: true, _count: { select: { members: true } } } } },
        },
        reportsMade: { orderBy: { createdAt: 'desc' }, take: 10 },
        reportsReceived: { orderBy: { createdAt: 'desc' }, take: 10 },
        _count: {
          select: {
            swipesFrom: true,
            matchesAsA: true,
            matchesAsB: true,
            giftsSent: true,
            giftsReceived: true,
            dateRequestsSent: true,
            dateRequestsReceived: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'User not found', 404);
    }

    return apiSuccess({ user });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const body = parseBody(userUpdateSchema, await request.json());

    const target = await db.user.findUnique({ where: { id }, select: { role: true } });
    if (!target) throw new AppError(ErrorCodes.NOT_FOUND, 'User not found', 404);
    if (target.role === 'ADMIN' && (body.suspended || body.unsuspend)) {
      throw new AppError(ErrorCodes.FORBIDDEN, 'Cannot suspend admin users', 403);
    }

    const data: Record<string, unknown> = {};
    if (body.role !== undefined) data.role = body.role;
    if (body.verified !== undefined) data.verified = body.verified;
    if (body.onboardingCompleted !== undefined) data.onboardingCompleted = body.onboardingCompleted;
    if (body.suspended === true) {
      data.suspendedAt = new Date();
    }
    if (body.unsuspend === true) {
      data.suspendedAt = null;
    }

    const user = await db.user.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, role: true, verified: true, onboardingCompleted: true, suspendedAt: true },
    });

    return apiSuccess({ user });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    const target = await db.user.findUnique({ where: { id }, select: { role: true } });
    if (!target) throw new AppError(ErrorCodes.NOT_FOUND, 'User not found', 404);
    if (target.role === 'ADMIN') {
      throw new AppError(ErrorCodes.FORBIDDEN, 'Cannot delete admin users', 403);
    }

    await db.user.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
