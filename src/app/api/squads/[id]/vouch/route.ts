export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { parseBody } from '@/lib/api/validate';
import { requireCurrentUser } from '@/lib/auth/guard';
import { vouchForProfile } from '@/lib/squad';
import { squadVouchSchema } from '@/lib/validators/referral';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireCurrentUser(request);
    const { id } = await params;
    const body = parseBody(squadVouchSchema, await request.json());
    const result = await vouchForProfile(user.id, id, body.targetUserId);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
