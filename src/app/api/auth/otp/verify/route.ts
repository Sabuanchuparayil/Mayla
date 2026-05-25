export const dynamic = 'force-dynamic';

import { z } from 'zod';
import { handleApiError } from '@/lib/api/errors';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { apiSuccess } from '@/lib/api/response';
import { parseBody } from '@/lib/api/validate';
import { loginWithPhone } from '@/lib/auth/service';

const verifySchema = z.object({
  phone: z.string().min(8).max(20),
  code: z.string().length(6, 'OTP must be 6 digits'),
});

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    await rateLimit(`auth:otp:verify:${ip}`, 10, 900);

    const body = parseBody(verifySchema, await request.json());

    await rateLimit(`otp-verify:phone:${body.phone}`, 5, 300);
    const result = await loginWithPhone(body.phone, body.code, {
      ip,
      userAgent: request.headers.get('user-agent') ?? undefined,
    });

    return apiSuccess({ user: result.user });
  } catch (error) {
    return handleApiError(error);
  }
}
