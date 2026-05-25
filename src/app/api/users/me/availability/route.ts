export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { parseBody } from '@/lib/api/validate';
import { requireCurrentUser } from '@/lib/auth/guard';
import { availabilityUpdateSchema } from '@/lib/validators/profile';
import {
  clearExpiredAvailability,
  computeAvailabilityExpiry,
  toAvailabilityState,
} from '@/lib/availability';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    await clearExpiredAvailability();

    const profile = await db.profile.findUnique({ where: { userId: user.id } });
    if (!profile) {
      return apiSuccess({
        availability: {
          availableDay: null,
          availableTime: null,
          availableExpiry: null,
          active: false,
          label: null,
        },
      });
    }

    return apiSuccess({ availability: toAvailabilityState(profile) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const body = parseBody(availabilityUpdateSchema, await request.json());

    const clearing = !body.availableDay || !body.availableTime;
    const profile = await db.profile.update({
      where: { userId: user.id },
      data: clearing
        ? {
            availableDay: null,
            availableTime: null,
            availableExpiry: null,
          }
        : {
            availableDay: body.availableDay,
            availableTime: body.availableTime,
            availableExpiry: computeAvailabilityExpiry(),
          },
    });

    return apiSuccess({ availability: toAvailabilityState(profile) });
  } catch (error) {
    return handleApiError(error);
  }
}
