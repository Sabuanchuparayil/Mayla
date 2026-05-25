export const dynamic = 'force-dynamic';

import { z } from 'zod';
import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { parseBody } from '@/lib/api/validate';
import { requireSession } from '@/lib/auth/guard';
import { createUploadPresign } from '@/lib/upload';

const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;

const presignSchema = z.object({
  contentType: z.enum(ALLOWED_CONTENT_TYPES).default('image/jpeg'),
  folder: z.enum(['avatars', 'photos', 'selfies']).default('photos'),
});

export async function POST(request: Request) {
  try {
    const user = await requireSession(request);
    const body = parseBody(presignSchema, await request.json());
    const result = await createUploadPresign(user.sub, body.contentType, body.folder);

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
