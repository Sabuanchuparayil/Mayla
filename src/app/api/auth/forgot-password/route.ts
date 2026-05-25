export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { parseBody } from '@/lib/api/validate';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { forgotPasswordSchema, resetPasswordSchema } from '@/lib/validators/profile';
import { ensureRedisConnected } from '@/lib/redis';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';

const RESET_TTL = 15 * 60;
const MOCK_RESET_CODE = '654321';

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    await rateLimit(`auth:forgot:${ip}`, 5, 900);

    const body = parseBody(forgotPasswordSchema, await request.json());
    const user = await db.user.findUnique({ where: { email: body.email.toLowerCase() } });

    if (user?.email) {
      const redis = await ensureRedisConnected();
      const code =
        process.env.NODE_ENV !== 'production' || process.env.OTP_HARDCODED === 'true'
          ? MOCK_RESET_CODE
          : String(Math.floor(100000 + Math.random() * 900000));
      await redis.set(`reset:${user.email}`, code, 'EX', RESET_TTL);

      if (process.env.NODE_ENV === 'development') {
        console.info(`[RESET] ${user.email} → ${code}`);
      }
    }

    return apiSuccess({
      message: 'If an account exists, a reset code was sent.',
      ...(process.env.NODE_ENV === 'development' ? { debugCode: MOCK_RESET_CODE } : {}),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const ip = getClientIp(request);
    await rateLimit(`auth:reset:${ip}`, 10, 900);

    const body = parseBody(resetPasswordSchema, await request.json());
    const email = body.email.toLowerCase();
    const redis = await ensureRedisConnected();
    const stored = await redis.get(`reset:${email}`);

    if (!stored || stored !== body.token) {
      return apiSuccess({ success: false, message: 'Invalid or expired reset code' });
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return apiSuccess({ success: false, message: 'Invalid or expired reset code' });
    }

    const password = await hashPassword(body.password);
    await db.user.update({ where: { id: user.id }, data: { password } });
    await redis.del(`reset:${email}`);

    return apiSuccess({ success: true, message: 'Password updated' });
  } catch (error) {
    return handleApiError(error);
  }
}
