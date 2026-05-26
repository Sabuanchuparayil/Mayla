export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { requireCurrentUser } from '@/lib/auth/guard';
import { computeGentlemanScore } from '@/lib/gentleman-score';
import { db } from '@/lib/db';

function starsFromScore(score: number): number {
  if (score >= 80) return 5;
  if (score >= 60) return 4;
  if (score >= 40) return 3;
  if (score >= 20) return 2;
  if (score > 0) return 1;
  return 0;
}

function tipsForScore(score: number): string[] {
  const tips: string[] = [];
  if (score < 40) {
    tips.push('Send thoughtful messages (20+ characters) to improve your score');
    tips.push('Reply within a few hours when someone messages you');
  } else if (score < 70) {
    tips.push('Keep conversations engaging with meaningful replies');
  } else {
    tips.push('Great job — your communication style builds trust');
  }
  tips.push('Avoid reports from other users — they lower your score');
  return tips;
}

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const profile = await db.profile.findUnique({
      where: { userId: user.id },
      select: { gentlemanScore: true, gender: true },
    });
    const score = profile?.gentlemanScore ?? (await computeGentlemanScore(user.id));
    const stars = starsFromScore(score);

    return apiSuccess({
      score,
      stars,
      label: profile?.gender === 'FEMALE' ? 'Trust score' : 'Gentleman score',
      tips: tipsForScore(score),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
