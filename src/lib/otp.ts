import { redis } from '@/lib/redis';

const TTL_SECONDS = 300; // 5 minutes
const MAX_ATTEMPTS = 3;

const codeKey = (id: string) => `otp:code:${id}`;
const attemptsKey = (id: string) => `otp:attempts:${id}`;

function randomCode(): string {
  return String(Math.floor(100_000 + Math.random() * 900_000));
}

/** Generates a new 6-digit OTP, stores it in Redis, resets attempt counter. */
export async function generateOTP(identifier: string): Promise<string> {
  const code = randomCode();
  const pipeline = redis.pipeline();
  pipeline.setex(codeKey(identifier), TTL_SECONDS, code);
  pipeline.del(attemptsKey(identifier));
  await pipeline.exec();
  return code;
}

export type OTPResult =
  | { success: true }
  | { success: false; reason: 'expired' | 'invalid' | 'max_attempts' };

/** Verifies the OTP. Increments attempt counter on failure. Cleans up on success. */
export async function verifyOTP(identifier: string, code: string): Promise<OTPResult> {
  const attemptsRaw = await redis.get(attemptsKey(identifier));
  const attempts = attemptsRaw ? parseInt(attemptsRaw, 10) : 0;

  if (attempts >= MAX_ATTEMPTS) return { success: false, reason: 'max_attempts' };

  const stored = await redis.get(codeKey(identifier));
  if (!stored) return { success: false, reason: 'expired' };

  if (stored !== code) {
    await redis.setex(attemptsKey(identifier), TTL_SECONDS, String(attempts + 1));
    return { success: false, reason: 'invalid' };
  }

  await redis.del(codeKey(identifier), attemptsKey(identifier));
  return { success: true };
}

/** Immediately invalidates an OTP (e.g. after too many failures or re-send). */
export async function invalidateOTP(identifier: string): Promise<void> {
  await redis.del(codeKey(identifier), attemptsKey(identifier));
}

/** Returns seconds remaining until the OTP expires (-2 if key doesn't exist). */
export async function getOTPTTL(identifier: string): Promise<number> {
  return redis.ttl(codeKey(identifier));
}
