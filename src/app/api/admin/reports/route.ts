export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { requireAdmin } from '@/lib/auth/guard';
import { listPendingReports } from '@/lib/moderation';

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const reports = await listPendingReports();
    return apiSuccess({ reports });
  } catch (error) {
    return handleApiError(error);
  }
}
