export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { parseBody } from '@/lib/api/validate';
import { requireCurrentUser } from '@/lib/auth/guard';
import { translateSchema } from '@/lib/validators/profile';
import { translateText } from '@/lib/translation';

export async function POST(request: Request) {
  try {
    await requireCurrentUser(request);
    const body = parseBody(translateSchema, await request.json());
    const result = await translateText(body.text, body.targetLang);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
