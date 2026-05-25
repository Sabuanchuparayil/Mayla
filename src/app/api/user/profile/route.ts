import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [profile, photos, verification, subscription] = await Promise.all([
    db.profile.findUnique({
      where: { userId },
      include: {
        profilePrompts: {
          include: { prompt: true },
          orderBy: { order: 'asc' },
        },
      },
    }),
    db.photo.findMany({
      where: { userId },
      orderBy: { order: 'asc' },
    }),
    db.verification.findFirst({
      where: { userId, status: 'APPROVED' },
      select: { id: true },
    }),
    db.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      select: { plan: true },
    }),
  ]);

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  return NextResponse.json({
    profile: {
      name: profile.name,
      birthDate: profile.birthDate.toISOString(),
      bio: profile.bio,
      relationshipIntent: profile.relationshipIntent,
      isVerified: verification !== null,
      plan: subscription?.plan ?? 'BASIC',
      photos: photos.map((p) => p.url),
      prompts: profile.profilePrompts.map((pp) => ({
        question: pp.prompt.question,
        answer: pp.answer,
      })),
    },
  });
}
