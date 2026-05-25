import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/admin/verification-queue?page=1
// Returns users with pending verification + unverified photos for manual review
export async function GET(req: NextRequest) {
  const role = req.headers.get('x-user-role');
  if (role !== 'ADMIN' && role !== 'MODERATOR') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') ?? '1', 10));
  const limit = 20;

  const [items, total] = await Promise.all([
    db.verification.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: {
            id: true,
            createdAt: true,
            profile: { select: { name: true, birthDate: true } },
            photos: {
              where: { isVerified: false },
              select: { id: true, url: true, order: true },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
      orderBy: { updatedAt: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.verification.count({ where: { status: 'PENDING' } }),
  ]);

  return NextResponse.json({ items, total, page, hasMore: page * limit < total });
}

const decisionSchema = z.object({
  userId: z.string().min(1),
  decision: z.enum(['APPROVED', 'REJECTED']),
  photoIds: z.array(z.string()).optional(),
});

// PATCH /api/admin/verification-queue — approve/reject selfie + optionally approve photos
export async function PATCH(req: NextRequest) {
  const role = req.headers.get('x-user-role');
  if (role !== 'ADMIN' && role !== 'MODERATOR') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = decisionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 });
  }

  const { userId, decision, photoIds } = parsed.data;

  await db.verification.updateMany({
    where: { userId },
    data: { status: decision },
  });

  if (decision === 'APPROVED' && photoIds?.length) {
    await db.photo.updateMany({
      where: { userId, id: { in: photoIds } },
      data: { isVerified: true },
    });
  }

  return NextResponse.json({ updated: true });
}
