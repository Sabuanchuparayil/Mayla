export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { requireCurrentUser } from '@/lib/auth/guard';
import { listUpcomingEvents, rsvpToEvent } from '@/lib/events';

export async function GET(request: Request) {
  try {
    await requireCurrentUser(request);
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city') ?? undefined;
    const events = await listUpcomingEvents(city);
    return apiSuccess({ events });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const body = (await request.json()) as { eventId: string; status?: 'GOING' | 'INTERESTED' };
    const rsvp = await rsvpToEvent(user.id, body.eventId, body.status ?? 'GOING');
    return apiSuccess({ rsvp });
  } catch (error) {
    return handleApiError(error);
  }
}
