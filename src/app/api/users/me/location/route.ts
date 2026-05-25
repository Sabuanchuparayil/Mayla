export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { parseBody } from '@/lib/api/validate';
import { requireCurrentUser } from '@/lib/auth/guard';
import { syncProfileLocation } from '@/lib/geo';
import { locationSchema } from '@/lib/validators/profile';
import { db } from '@/lib/db';

export async function PUT(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const body = parseBody(locationSchema, await request.json());

    const profile = await db.profile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        displayName: user.name ?? 'User',
        city: body.city,
      },
      update: {
        ...(body.city !== undefined ? { city: body.city } : {}),
      },
    });

    await syncProfileLocation(profile.id, body.latitude, body.longitude);

    return apiSuccess({ profile: { latitude: body.latitude, longitude: body.longitude, city: profile.city } });
  } catch (error) {
    return handleApiError(error);
  }
}
