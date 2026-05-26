import { db } from '@/lib/db';
import { AppError, ErrorCodes } from '@/lib/api/errors';
import { sendPushToUser } from '@/lib/push';
import type { Tier } from '@/lib/subscription';

export type ReferralBadge =
  | 'Connector'
  | 'Social Butterfly'
  | 'Inner Circle'
  | 'Mayla Ambassador';

export type ReferralMilestone = {
  count: number;
  badge: ReferralBadge;
  goldDays: number;
  platinumDays: number;
  priorityBoostHours: number | null;
  permanentPriority: boolean;
};

export const REFERRAL_MILESTONES: ReferralMilestone[] = [
  { count: 1, badge: 'Connector', goldDays: 3, platinumDays: 0, priorityBoostHours: null, permanentPriority: false },
  { count: 3, badge: 'Social Butterfly', goldDays: 7, platinumDays: 0, priorityBoostHours: 24, permanentPriority: false },
  { count: 5, badge: 'Inner Circle', goldDays: 0, platinumDays: 14, priorityBoostHours: null, permanentPriority: true },
  { count: 10, badge: 'Mayla Ambassador', goldDays: 0, platinumDays: 30, priorityBoostHours: null, permanentPriority: true },
];

const REFERRAL_STREAK_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const REFERRAL_STREAK_COUNT = 3;
const REFERRED_REWARD_GOLD_DAYS = 1;

function parseBadges(value: unknown): ReferralBadge[] {
  if (!Array.isArray(value)) return [];
  return value.filter((b): b is ReferralBadge =>
    typeof b === 'string' &&
    ['Connector', 'Social Butterfly', 'Inner Circle', 'Mayla Ambassador'].includes(b),
  );
}

function randomSuffix(length = 4): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function sanitizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);
}

export function getAppBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
}

export function buildInviteLink(code: string): string {
  return `${getAppBaseUrl()}/join/${encodeURIComponent(code)}`;
}

export function buildWhatsAppShareText(code: string, referrerName?: string | null): string {
  const link = buildInviteLink(code);
  const who = referrerName?.trim() ? `${referrerName.split(' ')[0]} invited you` : 'A friend invited you';
  return `${who} to Mayla — verified social discovery for expats in the Middle East. Join with code ${code}: ${link}`;
}

export async function generateUniqueReferralCode(seedName?: string | null): Promise<string> {
  const base = sanitizeCode((seedName ?? 'MAYLA').split(' ')[0] ?? 'MAYLA') || 'MAYLA';
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const code = `${base}${randomSuffix(4)}`;
    const existing = await db.user.findUnique({ where: { referralCode: code } });
    if (!existing) return code;
  }
  return `MAYLA${randomSuffix(6)}`;
}

export async function ensureReferralCode(userId: string): Promise<string> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { referralCode: true, name: true, profile: { select: { displayName: true } } },
  });
  if (!user) throw new AppError(ErrorCodes.NOT_FOUND, 'User not found', 404);
  if (user.referralCode) return user.referralCode;

  const code = await generateUniqueReferralCode(user.profile?.displayName ?? user.name);
  await db.user.update({ where: { id: userId }, data: { referralCode: code } });
  return code;
}

export async function customizeReferralCode(userId: string, rawCode: string): Promise<string> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { referralCodeCustomized: true },
  });
  if (!user) throw new AppError(ErrorCodes.NOT_FOUND, 'User not found', 404);
  if (user.referralCodeCustomized) {
    throw new AppError(ErrorCodes.CONFLICT, 'You can only customize your invite code once', 409);
  }

  const code = sanitizeCode(rawCode);
  if (code.length < 4 || code.length > 16) {
    throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Code must be 4–16 letters or numbers', 400);
  }

  const taken = await db.user.findFirst({ where: { referralCode: code, id: { not: userId } } });
  if (taken) throw new AppError(ErrorCodes.CONFLICT, 'That invite code is already taken', 409);

  await db.user.update({
    where: { id: userId },
    data: { referralCode: code, referralCodeCustomized: true },
  });
  return code;
}

export async function resolveReferrerByCode(code: string) {
  const normalized = sanitizeCode(code);
  if (!normalized) return null;
  return db.user.findUnique({
    where: { referralCode: normalized },
    select: { id: true, name: true, profile: { select: { displayName: true } } },
  });
}

export async function applyReferralCode(referredUserId: string, rawCode: string) {
  const code = sanitizeCode(rawCode);
  if (!code) throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Invalid invite code', 400);

  const existing = await db.referral.findUnique({ where: { referredId: referredUserId } });
  if (existing) {
    throw new AppError(ErrorCodes.CONFLICT, 'You already used an invite code', 409);
  }

  const referrer = await resolveReferrerByCode(code);
  if (!referrer) throw new AppError(ErrorCodes.NOT_FOUND, 'Invite code not found', 404);
  if (referrer.id === referredUserId) {
    throw new AppError(ErrorCodes.VALIDATION_ERROR, 'You cannot use your own invite code', 400);
  }

  return db.referral.create({
    data: {
      referrerId: referrer.id,
      referredId: referredUserId,
      code,
      status: 'PENDING',
    },
  });
}

async function extendSubscription(userId: string, tier: Tier, days: number) {
  const sub = await db.subscription.findUnique({ where: { userId } });
  const now = new Date();
  const base =
    sub?.expiresAt && sub.expiresAt > now && (sub.tier === tier || sub.tier === 'PLATINUM')
      ? sub.expiresAt
      : now;
  const expiresAt = new Date(base);
  expiresAt.setDate(expiresAt.getDate() + days);

  const nextTier =
    tier === 'PLATINUM'
      ? 'PLATINUM'
      : sub?.tier === 'PLATINUM'
        ? 'PLATINUM'
        : 'GOLD';

  await db.subscription.upsert({
    where: { userId },
    create: { userId, tier: nextTier, status: 'ACTIVE', expiresAt },
    update: { tier: nextTier, status: 'ACTIVE', expiresAt },
  });
}

function milestoneForCount(count: number): ReferralMilestone | null {
  let current: ReferralMilestone | null = null;
  for (const m of REFERRAL_MILESTONES) {
    if (count >= m.count) current = m;
  }
  return current;
}

function nextMilestone(count: number): ReferralMilestone | null {
  return REFERRAL_MILESTONES.find((m) => m.count > count) ?? null;
}

async function grantReferrerRewards(referrerId: string, completedCount: number) {
  const milestone = milestoneForCount(completedCount);
  if (!milestone) return null;

  const user = await db.user.findUnique({
    where: { id: referrerId },
    select: { referralBadges: true, priorityBoostUntil: true },
  });
  if (!user) return null;

  const badges = parseBadges(user.referralBadges);
  const newBadges = badges.includes(milestone.badge) ? badges : [...badges, milestone.badge];

  if (milestone.goldDays > 0) await extendSubscription(referrerId, 'GOLD', milestone.goldDays);
  if (milestone.platinumDays > 0) await extendSubscription(referrerId, 'PLATINUM', milestone.platinumDays);

  let priorityBoostUntil = user.priorityBoostUntil;
  if (milestone.priorityBoostHours) {
    const boost = new Date(Date.now() + milestone.priorityBoostHours * 60 * 60 * 1000);
    priorityBoostUntil = !priorityBoostUntil || boost > priorityBoostUntil ? boost : priorityBoostUntil;
  }
  if (milestone.permanentPriority) {
    const far = new Date();
    far.setFullYear(far.getFullYear() + 10);
    priorityBoostUntil = far;
  }

  await db.user.update({
    where: { id: referrerId },
    data: { referralBadges: newBadges, priorityBoostUntil },
  });

  await sendPushToUser(referrerId, {
    title: 'Referral milestone unlocked!',
    body: `You earned "${milestone.badge}" — ${milestone.goldDays || milestone.platinumDays} days premium unlocked.`,
    url: '/settings?tab=invite',
  });

  return milestone;
}

async function checkReferralStreak(referrerId: string) {
  const since = new Date(Date.now() - REFERRAL_STREAK_WINDOW_MS);
  const recent = await db.referral.count({
    where: { referrerId, status: 'COMPLETED', completedAt: { gte: since } },
  });
  if (recent === REFERRAL_STREAK_COUNT) {
    await extendSubscription(referrerId, 'PLATINUM', 1);
    await sendPushToUser(referrerId, {
      title: 'Referral streak bonus!',
      body: '3 friends joined in 7 days — enjoy 1 bonus Platinum day.',
      url: '/settings?tab=invite',
    });
  }
}

export async function completeReferralForUser(referredUserId: string) {
  const referral = await db.referral.findUnique({ where: { referredId: referredUserId } });
  if (!referral || referral.status === 'COMPLETED') return null;

  await db.referral.update({
    where: { id: referral.id },
    data: { status: 'COMPLETED', completedAt: new Date() },
  });

  await extendSubscription(referredUserId, 'GOLD', REFERRED_REWARD_GOLD_DAYS);

  const completedCount = await db.referral.count({
    where: { referrerId: referral.referrerId, status: 'COMPLETED' },
  });

  const milestone = await grantReferrerRewards(referral.referrerId, completedCount);
  await checkReferralStreak(referral.referrerId);

  return { referral, completedCount, milestone };
}

export async function getReferralStats(userId: string) {
  const code = await ensureReferralCode(userId);
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { referralBadges: true, priorityBoostUntil: true, name: true, profile: { select: { displayName: true } } },
  });

  const [pending, completed] = await Promise.all([
    db.referral.count({ where: { referrerId: userId, status: 'PENDING' } }),
    db.referral.count({ where: { referrerId: userId, status: 'COMPLETED' } }),
  ]);

  const current = milestoneForCount(completed);
  const next = nextMilestone(completed);
  const displayName = user?.profile?.displayName ?? user?.name ?? 'Friend';

  return {
    code,
    inviteLink: buildInviteLink(code),
    whatsAppText: buildWhatsAppShareText(code, displayName),
    pending,
    completed,
    badges: parseBadges(user?.referralBadges),
    currentMilestone: current,
    nextMilestone: next,
    progressToNext: next ? { current: completed, target: next.count } : null,
    priorityBoostActive: Boolean(user?.priorityBoostUntil && user.priorityBoostUntil > new Date()),
    canRevealFirstLike: completed >= 1,
  };
}

export async function hasReferralReveal(userId: string): Promise<boolean> {
  const completed = await db.referral.count({
    where: { referrerId: userId, status: 'COMPLETED' },
  });
  return completed >= 1;
}

export function userHasPriorityBoost(priorityBoostUntil: Date | null | undefined): boolean {
  return Boolean(priorityBoostUntil && priorityBoostUntil > new Date());
}
