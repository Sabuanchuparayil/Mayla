import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/user/account — basic account info
export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      phone: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      createdAt: true,
      profile: { select: { name: true } },
    },
  });

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ account: user });
}

// DELETE /api/user/account — soft-delete the account
export async function DELETE(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await db.user.update({
    where: { id: userId },
    data: {
      isDeleted: true,
      isActive: false,
      deletedAt: new Date(),
      // Anonymise PII
      email: null,
      phone: null,
    },
  });

  const response = NextResponse.json({ deleted: true });
  // Clear auth cookies
  response.cookies.delete('access_token');
  response.cookies.delete('refresh_token');
  return response;
}
