export const dynamic = 'force-dynamic';

import { SignJWT } from 'jose';
import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { requireSession } from '@/lib/auth/guard';
import { getEnv } from '@/lib/env';

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);

    const secret = new TextEncoder().encode(getEnv().JWT_SECRET);
    const token = await new SignJWT({ sub: session.sub, type: 'socket' })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(session.sub)
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(secret);

    return apiSuccess({ token });
  } catch (error) {
    return handleApiError(error);
  }
}
