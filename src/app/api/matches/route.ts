import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

function calcAge(birthDate: Date): number {
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const m = now.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) age--;
  return age;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const matches = await db.match.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
      status: 'ACTIVE',
    },
    orderBy: { createdAt: 'desc' },
    include: {
      user1: {
        include: {
          profile: true,
          photos: {
            where: { isMain: true },
            orderBy: { order: 'asc' },
            take: 1,
          },
          verifications: {
            where: { status: 'APPROVED' },
            take: 1,
          },
        },
      },
      user2: {
        include: {
          profile: true,
          photos: {
            where: { isMain: true },
            orderBy: { order: 'asc' },
            take: 1,
          },
          verifications: {
            where: { status: 'APPROVED' },
            take: 1,
          },
        },
      },
    },
  });

  const result = matches.map((match) => {
    const isUser1 = match.user1Id === userId;
    const other = isUser1 ? match.user2 : match.user1;
    const profile = other.profile;
    const primaryPhoto = other.photos[0];
    const isVerified = other.verifications.length > 0;

    return {
      matchId: match.id,
      user: {
        id: other.id,
        name: profile?.name ?? null,
        age: profile ? calcAge(profile.birthDate) : null,
        primaryPhotoUrl: primaryPhoto?.url ?? null,
        isVerified,
      },
      matchedAt: match.matchedAt,
    };
  });

  return NextResponse.json(result);
}
