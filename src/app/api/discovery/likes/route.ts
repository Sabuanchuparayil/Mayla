import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { buildDiscoveryCards } from '@/lib/discovery-cards';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const subscription = await db.subscription.findFirst({
    where: { userId, status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
    select: { plan: true },
  });
  const plan = subscription?.plan ?? 'BASIC';

  const [likers, mySwipes, matches] = await Promise.all([
    db.swipe.findMany({
      where: { swipedId: userId, action: { in: ['LIKE', 'SUPER_LIKE'] } },
      orderBy: { createdAt: 'desc' },
      select: { swiperId: true },
    }),
    db.swipe.findMany({
      where: { swiperId: userId },
      select: { swipedId: true },
    }),
    db.match.findMany({
      where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
      select: { user1Id: true, user2Id: true },
    }),
  ]);

  const alreadySwiped = new Set(mySwipes.map((s) => s.swipedId));
  const matchedUserIds = new Set<string>();
  for (const m of matches) {
    matchedUserIds.add(m.user1Id === userId ? m.user2Id : m.user1Id);
  }

  const seen = new Set<string>();
  const pendingLikerIds: string[] = [];
  for (const liker of likers) {
    const id = liker.swiperId;
    if (id === userId) continue;
    if (alreadySwiped.has(id)) continue;
    if (matchedUserIds.has(id)) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    pendingLikerIds.push(id);
  }

  const count = pendingLikerIds.length;

  if (plan === 'GOLD' || plan === 'PLATINUM') {
    const profiles = await buildDiscoveryCards(pendingLikerIds);
    return NextResponse.json({ locked: false, count, profiles });
  }

  return NextResponse.json({ locked: true, count, profiles: [] });
}
