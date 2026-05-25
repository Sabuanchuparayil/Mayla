import { createHash } from 'crypto';
import { db } from '@/lib/db';

export function hashPhone(normalized: string): string {
  return createHash('sha256').update(normalized).digest('hex');
}

export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '');
}

export async function syncContactHashes(userId: string, phones: string[]): Promise<number> {
  const hashes = [...new Set(phones.map((p) => hashPhone(normalizePhone(p))).filter((h) => h.length > 0))];
  await db.contactHash.deleteMany({ where: { userId } });
  if (hashes.length === 0) return 0;
  await db.contactHash.createMany({
    data: hashes.map((phoneHash) => ({ userId, phoneHash })),
    skipDuplicates: true,
  });
  return hashes.length;
}

export async function getBlockedContactUserIds(userId: string): Promise<string[]> {
  const myHashes = await db.contactHash.findMany({
    where: { userId },
    select: { phoneHash: true },
  });
  if (myHashes.length === 0) return [];

  const hashSet = myHashes.map((h) => h.phoneHash);
  const matches = await db.contactHash.findMany({
    where: {
      phoneHash: { in: hashSet },
      NOT: { userId },
    },
    select: { userId: true },
  });
  return [...new Set(matches.map((m) => m.userId))];
}

export async function getUsersHiddenByContacts(userId: string): Promise<string[]> {
  const profile = await db.profile.findUnique({ where: { userId }, include: { user: true } });
  if (!profile?.user.phone) return [];

  const myPhoneHash = hashPhone(normalizePhone(profile.user.phone));
  const blockers = await db.contactHash.findMany({
    where: { phoneHash: myPhoneHash },
    select: { userId: true },
  });
  return blockers.map((b) => b.userId);
}
