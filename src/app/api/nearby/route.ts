export const dynamic = 'force-dynamic';

import { handleApiError, AppError, ErrorCodes } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { requireCurrentUser } from '@/lib/auth/guard';
import { findNearbyProfiles } from '@/lib/geo';
import { z } from 'zod';
import { parseBody } from '@/lib/api/validate';

const querySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radiusMeters: z.coerce.number().min(100).max(100000).default(50000),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const { searchParams } = new URL(request.url);

    const rawLat = searchParams.get('latitude');
    const rawLng = searchParams.get('longitude');
    if (rawLat == null || rawLat === '' || rawLng == null || rawLng === '') {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'latitude and longitude are required', 422);
    }

    const params = parseBody(querySchema, {
      latitude: rawLat,
      longitude: rawLng,
      radiusMeters: searchParams.get('radiusMeters') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    });

    const profiles = await findNearbyProfiles(
      params.latitude,
      params.longitude,
      params.radiusMeters,
      user.id,
      params.limit,
    );

    return apiSuccess({ profiles });
  } catch (error) {
    return handleApiError(error);
  }
}
