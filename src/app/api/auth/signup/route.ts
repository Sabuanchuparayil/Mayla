export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { apiSuccess } from '@/lib/api/response';
import { parseBody } from '@/lib/api/validate';
import { registerUser } from '@/lib/auth/service';
import { signupSchema } from '@/lib/validators/auth';

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    await rateLimit(`auth:signup:${ip}`, 5, 3600);

    const body = parseBody(signupSchema, await request.json());
    const result = await registerUser(body, {
      ip,
      userAgent: request.headers.get('user-agent') ?? undefined,
    });

    return apiSuccess(
      { user: result.user },
      { status: 201 },
      { message: 'Account created successfully' },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
