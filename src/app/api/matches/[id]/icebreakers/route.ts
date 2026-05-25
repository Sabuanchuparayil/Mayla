export const dynamic = 'force-dynamic';

import { handleApiError, AppError, ErrorCodes } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { requireCurrentUser } from '@/lib/auth/guard';
import { getMatchForUser } from '@/lib/matches';
import { suggestIcebreakers, type CompatibilityProfile } from '@/lib/compatibility';
import { db } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

function parseJsonArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

function parsePrompts(value: unknown): { prompt: string; answer: string }[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (v): v is { prompt: string; answer: string } =>
      typeof v === 'object' &&
      v !== null &&
      typeof (v as { prompt?: unknown }).prompt === 'string' &&
      typeof (v as { answer?: unknown }).answer === 'string',
  );
}

export async function GET(request: Request, { params }: Params) {
  try {
    const user = await requireCurrentUser(request);
    const { id } = await params;
    const match = await getMatchForUser(id, user.id);

    if (!match || match.status !== 'ACCEPTED') {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Match not found', 404);
    }

    const otherUserId = match.userAId === user.id ? match.userBId : match.userAId;
    const [viewerProfile, otherProfile] = await Promise.all([
      db.profile.findUnique({ where: { userId: user.id } }),
      db.profile.findUnique({ where: { userId: otherUserId } }),
    ]);

    const viewer: CompatibilityProfile = {
      userId: user.id,
      interests: parseJsonArray(viewerProfile?.interests),
      personalityPrompts: parsePrompts(viewerProfile?.personalityPrompts),
    };

    const candidate: CompatibilityProfile = {
      userId: otherUserId,
      interests: parseJsonArray(otherProfile?.interests),
      city: otherProfile?.city ?? undefined,
      personalityPrompts: parsePrompts(otherProfile?.personalityPrompts),
    };

    const icebreakers = suggestIcebreakers(viewer, candidate);
    return apiSuccess({ icebreakers });
  } catch (error) {
    return handleApiError(error);
  }
}
