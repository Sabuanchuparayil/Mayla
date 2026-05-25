export const dynamic = 'force-dynamic';

import { z } from 'zod';
import { handleApiError } from '@/lib/api/errors';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { apiSuccess } from '@/lib/api/response';
import { parseBody } from '@/lib/api/validate';
import { sendOtp } from '@/lib/otp';

const sendSchema = z.object({
  phone: z.string().min(8, 'Invalid phone number').max(20),
});

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    await rateLimit(`auth:otp:send:${ip}`, 5, 900);

    const { phone } = parseBody(sendSchema, await request.json());
    const result = await sendOtp(phone);

    return apiSuccess({
      expiresIn: result.expiresIn,
      ...(process.env.NODE_ENV === 'development' ? { debugCode: result.code } : {}),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
