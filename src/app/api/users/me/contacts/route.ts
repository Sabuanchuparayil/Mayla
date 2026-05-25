export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { parseBody } from '@/lib/api/validate';
import { requireCurrentUser } from '@/lib/auth/guard';
import { contactsSyncSchema } from '@/lib/validators/profile';
import { syncContactHashes } from '@/lib/contacts';

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const body = parseBody(contactsSyncSchema, await request.json());
    const count = await syncContactHashes(user.id, body.phones);
    return apiSuccess({ synced: count });
  } catch (error) {
    return handleApiError(error);
  }
}
