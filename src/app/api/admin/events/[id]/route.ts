export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { parseBody } from '@/lib/api/validate';
import { requireAdmin } from '@/lib/auth/guard';
import { deleteCommunityEvent, updateCommunityEvent } from '@/lib/events';
import { z } from 'zod';

const eventUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  city: z.string().min(1).max(100).optional(),
  country: z.string().max(10).optional(),
  category: z.string().min(1).max(100).optional(),
  startsAt: z.string().datetime().optional(),
  maxAttendees: z.number().int().positive().nullable().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const body = parseBody(eventUpdateSchema, await request.json());
    const event = await updateCommunityEvent(id, {
      ...body,
      startsAt: body.startsAt ? new Date(body.startsAt) : undefined,
    });
    return apiSuccess({ event });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    await deleteCommunityEvent(id);
    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
