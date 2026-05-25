export const dynamic = 'force-dynamic';

import { handleApiError, AppError, ErrorCodes } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { parseBody } from '@/lib/api/validate';
import { requireCurrentUser } from '@/lib/auth/guard';
import { preferencesUpdateSchema } from '@/lib/validators/profile';
import {
  getUserPreferences,
  upsertUserPreferences,
  canFilterByGoals,
  maxGoalFiltersForTier,
} from '@/lib/preferences';
import { getUserTier } from '@/lib/subscription';

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const prefs = await getUserPreferences(user.id);
    const tier = await getUserTier(user.id);
    return apiSuccess({
      preferences: prefs,
      tier,
      canFilterGoals: canFilterByGoals(tier),
      maxGoalFilters: maxGoalFiltersForTier(tier),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const tier = await getUserTier(user.id);
    const body = parseBody(preferencesUpdateSchema, await request.json());

    if (body.relationshipGoals && body.relationshipGoals.length > 0) {
      if (!canFilterByGoals(tier)) {
        throw new AppError(
          ErrorCodes.FORBIDDEN,
          'Upgrade to Gold to filter by relationship goal',
          403,
        );
      }
      const max = maxGoalFiltersForTier(tier);
      if (body.relationshipGoals.length > max) {
        throw new AppError(
          ErrorCodes.VALIDATION_ERROR,
          `Your plan allows filtering by up to ${max} goal(s)`,
          422,
        );
      }
    }

    const prefs = await upsertUserPreferences(user.id, body);
    return apiSuccess({ preferences: prefs });
  } catch (error) {
    return handleApiError(error);
  }
}
