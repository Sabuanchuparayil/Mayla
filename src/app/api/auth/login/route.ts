export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { apiSuccess } from '@/lib/api/response';
import { parseBody } from '@/lib/api/validate';
import { loginUser } from '@/lib/auth/service';
import { loginSchema } from '@/lib/validators/auth';

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    await rateLimit(`auth:login:${ip}`, 10, 900);

    const body = parseBody(loginSchema, await request.json());
    const result = await loginUser(body, {
      ip,
      userAgent: request.headers.get('user-agent') ?? undefined,
    });

    return apiSuccess({ user: result.user });
  } catch (error) {
    return handleApiError(error);
  }
}
