import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

// DELETE /api/blocks/:userId — unblock
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const blockerId = req.headers.get('x-user-id');
  if (!blockerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { userId: blockedId } = await params;

  const deleted = await db.block.deleteMany({
    where: { blockerId, blockedId },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ error: 'Block not found' }, { status: 404 });
  }

  await redis.del(`discovery:stack:${blockerId}`, `discovery:stack:${blockedId}`);

  return NextResponse.json({ unblocked: true });
}
