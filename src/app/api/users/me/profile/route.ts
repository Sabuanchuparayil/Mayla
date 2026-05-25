export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { parseBody } from '@/lib/api/validate';
import { requireCurrentUser } from '@/lib/auth/guard';
import { profileUpdateSchema } from '@/lib/validators/profile';
import { syncTravelLocation } from '@/lib/geo';
import { computeProfileCompleteness, getCompletenessHints } from '@/lib/profile/completeness';
import { db } from '@/lib/db';

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

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const profile = await db.profile.findUnique({ where: { userId: user.id } });

    if (!profile) {
      return apiSuccess({
        profile: null,
        completeness: 0,
        hints: ['Complete your profile to get more matches'],
      });
    }

    const completeness = computeProfileCompleteness(profile);
    const hints = getCompletenessHints(profile);

    return apiSuccess({
      profile: {
        ...profile,
        interests: parseJsonArray(profile.interests),
        languages: parseJsonArray(profile.languages),
        lifestyle: parseJsonArray(profile.lifestyle),
        photos: parseJsonArray(profile.photos),
        personalityPrompts: parsePrompts(profile.personalityPrompts),
        dreamDates: parseJsonArray(profile.dreamDates),
      },
      completeness,
      hints,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const body = parseBody(profileUpdateSchema, await request.json());

    const profile = await db.profile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        displayName: body.displayName ?? user.name ?? 'User',
        bio: body.bio ?? null,
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
        gender: body.gender ?? null,
        nationality: body.nationality ?? null,
        languages: body.languages ?? [],
        education: body.education ?? null,
        jobTitle: body.jobTitle ?? null,
        industry: body.industry ?? null,
        relationshipGoal: body.relationshipGoal ?? null,
        lifestyle: body.lifestyle ?? [],
        smoking: body.smoking ?? null,
        drinking: body.drinking ?? null,
        exercise: body.exercise ?? null,
        height: body.height ?? null,
        personalityPrompts: body.personalityPrompts ?? [],
        interests: body.interests ?? [],
        photos: body.photos ?? [],
        city: body.city ?? null,
        country: body.country ?? 'AE',
        travelModeEnabled: body.travelModeEnabled ?? false,
        travelCity: body.travelCity ?? null,
      },
      update: {
        ...(body.displayName !== undefined ? { displayName: body.displayName } : {}),
        ...(body.bio !== undefined ? { bio: body.bio } : {}),
        ...(body.birthDate !== undefined
          ? { birthDate: body.birthDate ? new Date(body.birthDate) : null }
          : {}),
        ...(body.gender !== undefined ? { gender: body.gender } : {}),
        ...(body.nationality !== undefined ? { nationality: body.nationality } : {}),
        ...(body.languages !== undefined ? { languages: body.languages } : {}),
        ...(body.education !== undefined ? { education: body.education } : {}),
        ...(body.jobTitle !== undefined ? { jobTitle: body.jobTitle } : {}),
        ...(body.industry !== undefined ? { industry: body.industry } : {}),
        ...(body.relationshipGoal !== undefined ? { relationshipGoal: body.relationshipGoal } : {}),
        ...(body.lifestyle !== undefined ? { lifestyle: body.lifestyle } : {}),
        ...(body.smoking !== undefined ? { smoking: body.smoking } : {}),
        ...(body.drinking !== undefined ? { drinking: body.drinking } : {}),
        ...(body.exercise !== undefined ? { exercise: body.exercise } : {}),
        ...(body.height !== undefined ? { height: body.height } : {}),
        ...(body.personalityPrompts !== undefined ? { personalityPrompts: body.personalityPrompts } : {}),
        ...(body.interests !== undefined ? { interests: body.interests } : {}),
        ...(body.photos !== undefined ? { photos: body.photos } : {}),
        ...(body.city !== undefined ? { city: body.city } : {}),
        ...(body.country !== undefined ? { country: body.country } : {}),
        ...(body.travelModeEnabled !== undefined ? { travelModeEnabled: body.travelModeEnabled } : {}),
        ...(body.travelCity !== undefined ? { travelCity: body.travelCity } : {}),
        ...(body.profilePaused !== undefined ? { profilePaused: body.profilePaused } : {}),
        ...(body.incognitoMode !== undefined ? { incognitoMode: body.incognitoMode } : {}),
        ...(body.ladiesFirstMessaging !== undefined ? { ladiesFirstMessaging: body.ladiesFirstMessaging } : {}),
        ...(body.dreamDates !== undefined ? { dreamDates: body.dreamDates } : {}),
        ...(body.openToDifferentCultures !== undefined ? { openToDifferentCultures: body.openToDifferentCultures } : {}),
        ...(body.relocateWillingness !== undefined ? { relocateWillingness: body.relocateWillingness } : {}),
        ...(body.lifestyleExpectations !== undefined ? { lifestyleExpectations: body.lifestyleExpectations } : {}),
        ...(body.photoBlurUntilMatch !== undefined ? { photoBlurUntilMatch: body.photoBlurUntilMatch } : {}),
        ...(body.locale !== undefined ? { locale: body.locale } : {}),
      },
    });

    if (
      body.travelLatitude !== undefined ||
      body.travelLongitude !== undefined ||
      body.travelModeEnabled === false
    ) {
      const travelLat = body.travelModeEnabled === false ? null : (body.travelLatitude ?? null);
      const travelLng = body.travelModeEnabled === false ? null : (body.travelLongitude ?? null);
      await syncTravelLocation(profile.id, travelLat, travelLng);
    }

    if (body.displayName && body.displayName !== user.name) {
      await db.user.update({ where: { id: user.id }, data: { name: body.displayName } });
    }

    const completeness = computeProfileCompleteness(profile);

    return apiSuccess({ profile, completeness });
  } catch (error) {
    return handleApiError(error);
  }
}
