import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { db } from '@/lib/db';

// GET /api/admin/reports?status=PENDING&page=1
export async function GET(req: NextRequest) {
  const role = req.headers.get('x-user-role');
  if (role !== 'ADMIN' && role !== 'MODERATOR') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const status = searchParams.get('status') ?? 'PENDING';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = 20;

  const [reports, total] = await Promise.all([
    db.report.findMany({
      where: { status: status as 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED' },
      include: {
        reporter: {
          select: {
            id: true,
            profile: { select: { name: true } },
          },
        },
        reported: {
          select: {
            id: true,
            isBanned: true,
            profile: { select: { name: true } },
            photos: {
              where: { isMain: true },
              select: { url: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.report.count({
      where: { status: status as 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED' },
    }),
  ]);

  return NextResponse.json({ reports, total, page, hasMore: page * limit < total });
}

const actionSchema = z.object({
  reportId: z.string().min(1),
  action: z.enum(['REVIEWED', 'RESOLVED', 'DISMISSED']),
  banReported: z.boolean().optional().default(false),
});

// PATCH /api/admin/reports — resolve a report
export async function PATCH(req: NextRequest) {
  const role = req.headers.get('x-user-role');
  const adminId = req.headers.get('x-user-id');
  if (role !== 'ADMIN' && role !== 'MODERATOR') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 });
  }

  const { reportId, action, banReported } = parsed.data;

  const report = await db.report.update({
    where: { id: reportId },
    data: {
      status: action,
      reviewedAt: new Date(),
      reviewedById: adminId ?? undefined,
    },
    select: { reportedId: true },
  });

  if (banReported) {
    await db.user.update({
      where: { id: report.reportedId },
      data: { isBanned: true },
    });
  }

  return NextResponse.json({ updated: true });
}
