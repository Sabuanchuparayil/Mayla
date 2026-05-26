export const dynamic = 'force-dynamic';

import { handleApiError, AppError, ErrorCodes } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { parseBody } from '@/lib/api/validate';
import { requireCurrentUser } from '@/lib/auth/guard';
import { privacySettingsSchema } from '@/lib/validators/profile';
import { getUserTier, tierFeatures } from '@/lib/subscription';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const profile = await db.profile.findUnique({ where: { userId: user.id } });
    const tier = await getUserTier(user.id);
    return apiSuccess({
      profilePaused: profile?.profilePaused ?? false,
      incognitoMode: profile?.incognitoMode ?? false,
      ladiesFirstMessaging: profile?.ladiesFirstMessaging ?? false,
      photoBlurUntilMatch: profile?.photoBlurUntilMatch ?? false,
      canUseIncognito: tierFeatures(tier).incognitoMode,
      canControlPhotoBlur: tierFeatures(tier).photoPrivacyControls,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const body = parseBody(privacySettingsSchema, await request.json());
    const tier = await getUserTier(user.id);

    if (body.incognitoMode && !tierFeatures(tier).incognitoMode) {
      throw new AppError(ErrorCodes.FORBIDDEN, 'Upgrade to Gold for Incognito mode', 403);
    }

    if (body.photoBlurUntilMatch !== undefined && !tierFeatures(tier).photoPrivacyControls) {
      throw new AppError(ErrorCodes.FORBIDDEN, 'Upgrade to Gold for photo privacy controls', 403);
    }

    const profile = await db.profile.update({
      where: { userId: user.id },
      data: {
        ...(body.profilePaused !== undefined ? { profilePaused: body.profilePaused } : {}),
        ...(body.incognitoMode !== undefined ? { incognitoMode: body.incognitoMode } : {}),
        ...(body.ladiesFirstMessaging !== undefined ? { ladiesFirstMessaging: body.ladiesFirstMessaging } : {}),
        ...(body.photoBlurUntilMatch !== undefined ? { photoBlurUntilMatch: body.photoBlurUntilMatch } : {}),
      },
    });

    return apiSuccess({
      profilePaused: profile.profilePaused,
      incognitoMode: profile.incognitoMode,
      ladiesFirstMessaging: profile.ladiesFirstMessaging,
      photoBlurUntilMatch: profile.photoBlurUntilMatch,
      canUseIncognito: tierFeatures(tier).incognitoMode,
      canControlPhotoBlur: tierFeatures(tier).photoPrivacyControls,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
