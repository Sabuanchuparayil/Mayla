import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { db } from '@/lib/db';
import { getIO } from '@/lib/socket-io';
import { ReportCategory } from '@/generated/prisma/enums';

const schema = z.object({
  reportedUserId: z.string().min(1),
  category: z.enum([
    'HARASSMENT',
    'FAKE_PROFILE',
    'INAPPROPRIATE_CONTENT',
    'UNDERAGE',
    'SPAM',
    'OTHER',
  ]),
  description: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  const reporterId = req.headers.get('x-user-id');
  if (!reporterId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 });
  }

  const { reportedUserId, category, description } = parsed.data;

  if (reporterId === reportedUserId) {
    return NextResponse.json({ error: 'Cannot report yourself' }, { status: 400 });
  }

  const reportedUser = await db.user.findUnique({
    where: { id: reportedUserId },
    select: { id: true },
  });
  if (!reportedUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Prevent duplicate pending reports from same reporter
  const existing = await db.report.findFirst({
    where: { reporterId, reportedId: reportedUserId, status: 'PENDING' },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ error: 'Report already submitted' }, { status: 409 });
  }

  const report = await db.report.create({
    data: {
      reporterId,
      reportedId: reportedUserId,
      category: category as ReportCategory,
      description: description ?? null,
    },
    include: {
      reporter: { select: { id: true, phone: true, email: true } },
      reported: {
        select: {
          id: true,
          phone: true,
          email: true,
          profile: { select: { name: true } },
        },
      },
    },
  });

  // Notify connected admin/moderator sockets
  getIO()?.to('admin:room').emit('admin:new_report', {
    reportId: report.id,
    category: report.category,
    reportedName: report.reported.profile?.name ?? 'Unknown',
    createdAt: report.createdAt,
  });

  return NextResponse.json({ reportId: report.id }, { status: 201 });
}
