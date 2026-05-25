export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { parseBody } from '@/lib/api/validate';
import { requireCurrentUser } from '@/lib/auth/guard';
import { profileUpdateSchema } from '@/lib/validators/profile';
import { syncTravelLocation } from '@/lib/geo';
import { db } from '@/lib/db';

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
        ...(body.interests !== undefined ? { interests: body.interests } : {}),
        ...(body.photos !== undefined ? { photos: body.photos } : {}),
        ...(body.city !== undefined ? { city: body.city } : {}),
        ...(body.country !== undefined ? { country: body.country } : {}),
        ...(body.travelModeEnabled !== undefined ? { travelModeEnabled: body.travelModeEnabled } : {}),
        ...(body.travelCity !== undefined ? { travelCity: body.travelCity } : {}),
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

    return apiSuccess({ profile });
  } catch (error) {
    return handleApiError(error);
  }
}
