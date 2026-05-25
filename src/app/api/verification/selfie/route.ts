export const dynamic = 'force-dynamic';

import { handleApiError, AppError, ErrorCodes } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { requireCurrentUser } from '@/lib/auth/guard';
import { db } from '@/lib/db';
import { verifySelfie } from '@/lib/verification';

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const body = (await request.json()) as { imageKey?: string };

    if (!body.imageKey) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'imageKey is required', 400);
    }

    if (!body.imageKey.startsWith(`uploads/${user.id}/`)) {
      throw new AppError(ErrorCodes.FORBIDDEN, 'Invalid image key', 403);
    }

    const result = await verifySelfie(body.imageKey);

    if (result.verified) {
      await db.user.update({
        where: { id: user.id },
        data: { verified: true },
      });
    }

    return apiSuccess({ ...result });
  } catch (error) {
    return handleApiError(error);
  }
}
