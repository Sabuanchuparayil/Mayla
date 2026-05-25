export const dynamic = 'force-dynamic';

import { handleApiError, AppError, ErrorCodes } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { requireCurrentUser } from '@/lib/auth/guard';
import { getDiscoverFeed } from '@/lib/discover';
import { z } from 'zod';
import { parseBody } from '@/lib/api/validate';

const querySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const { searchParams } = new URL(request.url);
    const params = parseBody(querySchema, {
      latitude: searchParams.get('latitude') ?? undefined,
      longitude: searchParams.get('longitude') ?? undefined,
      limit: searchParams.get('limit') ?? 20,
    });

    const feed = await getDiscoverFeed(user.id, params);
    return apiSuccess(feed);
  } catch (error) {
    return handleApiError(error);
  }
}
