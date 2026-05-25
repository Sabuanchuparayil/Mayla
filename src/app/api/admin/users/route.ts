import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/users?q=<search>&page=1
export async function GET(req: NextRequest) {
  const role = req.headers.get('x-user-role');
  if (role !== 'ADMIN' && role !== 'MODERATOR') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const q = searchParams.get('q')?.trim() ?? '';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = 20;

  const where = q
    ? {
        isDeleted: false,
        OR: [
          { phone: { contains: q } },
          { email: { contains: q } },
          { profile: { name: { contains: q, mode: 'insensitive' as const } } },
        ],
      }
    : { isDeleted: false };

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        phone: true,
        email: true,
        role: true,
        isBanned: true,
        createdAt: true,
        profile: { select: { name: true } },
        verifications: { select: { status: true }, take: 1, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.user.count({ where }),
  ]);

  return NextResponse.json({ users, total, page, hasMore: page * limit < total });
}
