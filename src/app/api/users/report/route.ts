export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { parseBody } from '@/lib/api/validate';
import { requireCurrentUser } from '@/lib/auth/guard';
import { reportUser } from '@/lib/moderation';
import { reportSchema } from '@/lib/validators/profile';

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const body = parseBody(reportSchema, await request.json());
    const report = await reportUser(user.id, body.userId, body.reason, body.details);
    return apiSuccess({ reportId: report.id });
  } catch (error) {
    return handleApiError(error);
  }
}
