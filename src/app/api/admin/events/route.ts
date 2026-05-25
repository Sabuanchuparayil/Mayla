export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { parseBody } from '@/lib/api/validate';
import { requireAdmin } from '@/lib/auth/guard';
import { createCommunityEvent, listAllEvents } from '@/lib/events';
import { z } from 'zod';

const eventCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  city: z.string().min(1).max(100),
  country: z.string().max(10).optional(),
  category: z.string().min(1).max(100),
  startsAt: z.string().datetime(),
  maxAttendees: z.number().int().positive().optional(),
});

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const events = await listAllEvents();
    return apiSuccess({ events });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const body = parseBody(eventCreateSchema, await request.json());
    const event = await createCommunityEvent({
      ...body,
      startsAt: new Date(body.startsAt),
    });
    return apiSuccess({ event });
  } catch (error) {
    return handleApiError(error);
  }
}
