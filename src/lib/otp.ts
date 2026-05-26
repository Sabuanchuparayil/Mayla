import { randomInt, timingSafeEqual } from 'crypto';
import { ensureRedisConnected } from '@/lib/redis';

const OTP_TTL_SECONDS = 5 * 60;
const TEST_OTP = '123456';

/** Normalize phone to digits-only for consistent Redis keys and DB lookups. */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

function otpKey(phone: string): string {
  return `otp:${normalizePhone(phone)}`;
}

export function generateOtp(): string {
  if (process.env.NODE_ENV !== 'production' || process.env.OTP_HARDCODED === 'true') {
    return TEST_OTP;
  }
  return String(randomInt(100000, 999999));
}

export async function storeOtp(phone: string, code: string): Promise<void> {
  const redis = await ensureRedisConnected();
  await redis.set(otpKey(phone), code, 'EX', OTP_TTL_SECONDS);
}

export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  const redis = await ensureRedisConnected();
  const stored = await redis.get(otpKey(phone));
  if (!stored) return false;

  const valid =
    stored.length === code.length &&
    timingSafeEqual(Buffer.from(stored), Buffer.from(code));
  if (valid) {
    await redis.del(otpKey(phone));
  }
  return valid;
}

export async function sendOtp(phone: string): Promise<{ code: string; expiresIn: number }> {
  const normalized = normalizePhone(phone);
  const code = generateOtp();
  await storeOtp(normalized, code);

  return { code, expiresIn: OTP_TTL_SECONDS };
}
