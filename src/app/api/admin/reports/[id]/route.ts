export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { parseBody } from '@/lib/api/validate';
import { requireAdmin } from '@/lib/auth/guard';
import { resolveReport } from '@/lib/moderation';
import { z } from 'zod';

const reportActionSchema = z.object({
  action: z.enum(['DISMISS', 'WARN', 'BAN']),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const body = parseBody(reportActionSchema, await request.json());
    const report = await resolveReport(id, body.action);
    return apiSuccess({ report });
  } catch (error) {
    return handleApiError(error);
  }
}
