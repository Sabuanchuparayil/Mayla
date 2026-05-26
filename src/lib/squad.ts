import { db } from '@/lib/db';
import { AppError, ErrorCodes } from '@/lib/api/errors';
import { generateUniqueReferralCode } from '@/lib/referral';

export const SQUAD_UNLOCK_MEMBERS = 3;
export const SQUAD_BOOST_MEMBERS = 5;

function sanitizeSquadCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
}

async function generateUniqueSquadCode(name: string): Promise<string> {
  const base = sanitizeSquadCode(name.split(' ').slice(0, 2).join('')) || 'SQUAD';
  for (let i = 0; i < 20; i += 1) {
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    const code = `${base}${suffix}`.slice(0, 12);
    const existing = await db.squad.findUnique({ where: { code } });
    if (!existing) return code;
  }
  return `SQ${Date.now().toString(36).toUpperCase().slice(-8)}`;
}

function parseJsonArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

export type SquadSummary = {
  id: string;
  name: string;
  code: string;
  memberCount: number;
  unlocked: boolean;
  boostActive: boolean;
  role: 'OWNER' | 'MEMBER';
  inviteLink: string;
};

export type SquadDiscoverProfile = {
  userId: string;
  displayName: string;
  photos: string[];
  city: string | null;
  vouchCount: number;
  vouchedBy: string[];
};

function getAppBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
}

export async function createSquad(userId: string, name: string): Promise<SquadSummary> {
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 40) {
    throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Squad name must be 2–40 characters', 400);
  }

  const code = await generateUniqueSquadCode(trimmed);
  const squad = await db.squad.create({
    data: {
      name: trimmed,
      ownerId: userId,
      code,
      members: { create: { userId, role: 'OWNER' } },
    },
    include: { members: true },
  });

  return {
    id: squad.id,
    name: squad.name,
    code: squad.code,
    memberCount: squad.members.length,
    unlocked: squad.members.length >= SQUAD_UNLOCK_MEMBERS,
    boostActive: squad.members.length >= SQUAD_BOOST_MEMBERS,
    role: 'OWNER',
    inviteLink: `${getAppBaseUrl()}/join/${encodeURIComponent(code)}?squad=1`,
  };
}

export async function listUserSquads(userId: string): Promise<SquadSummary[]> {
  const memberships = await db.squadMember.findMany({
    where: { userId, squad: { isActive: true } },
    include: { squad: { include: { _count: { select: { members: true } } } } },
    orderBy: { joinedAt: 'asc' },
  });

  return memberships.map((m) => ({
    id: m.squad.id,
    name: m.squad.name,
    code: m.squad.code,
    memberCount: m.squad._count.members,
    unlocked: m.squad._count.members >= SQUAD_UNLOCK_MEMBERS,
    boostActive: m.squad._count.members >= SQUAD_BOOST_MEMBERS,
    role: m.role,
    inviteLink: `${getAppBaseUrl()}/join/${encodeURIComponent(m.squad.code)}?squad=1`,
  }));
}

export async function getSquadForUser(squadId: string, userId: string) {
  const membership = await db.squadMember.findUnique({
    where: { squadId_userId: { squadId, userId } },
    include: {
      squad: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  profile: { select: { displayName: true, photos: true } },
                },
              },
            },
            orderBy: { joinedAt: 'asc' },
          },
          _count: { select: { members: true, vouches: true } },
        },
      },
    },
  });

  if (!membership?.squad.isActive) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Squad not found', 404);
  }

  const squad = membership.squad;
  return {
    id: squad.id,
    name: squad.name,
    code: squad.code,
    memberCount: squad._count.members,
    vouchCount: squad._count.vouches,
    unlocked: squad._count.members >= SQUAD_UNLOCK_MEMBERS,
    boostActive: squad._count.members >= SQUAD_BOOST_MEMBERS,
    role: membership.role,
    inviteLink: `${getAppBaseUrl()}/join/${encodeURIComponent(squad.code)}?squad=1`,
    members: squad.members.map((m) => ({
      userId: m.userId,
      role: m.role,
      displayName: m.user.profile?.displayName ?? m.user.name ?? 'Member',
      joinedAt: m.joinedAt.toISOString(),
    })),
  };
}

export async function joinSquadByCode(userId: string, rawCode: string) {
  const code = sanitizeSquadCode(rawCode);
  const squad = await db.squad.findFirst({ where: { code, isActive: true } });
  if (!squad) throw new AppError(ErrorCodes.NOT_FOUND, 'Squad not found', 404);

  const existing = await db.squadMember.findUnique({
    where: { squadId_userId: { squadId: squad.id, userId } },
  });
  if (existing) return getSquadForUser(squad.id, userId);

  await db.squadMember.create({
    data: { squadId: squad.id, userId, role: 'MEMBER' },
  });

  return getSquadForUser(squad.id, userId);
}

export async function updateSquad(userId: string, squadId: string, name: string) {
  const squad = await db.squad.findUnique({ where: { id: squadId } });
  if (!squad?.isActive) throw new AppError(ErrorCodes.NOT_FOUND, 'Squad not found', 404);
  if (squad.ownerId !== userId) throw new AppError(ErrorCodes.FORBIDDEN, 'Only the owner can rename the squad', 403);

  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 40) {
    throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Squad name must be 2–40 characters', 400);
  }

  await db.squad.update({ where: { id: squadId }, data: { name: trimmed } });
  return getSquadForUser(squadId, userId);
}

export async function disbandSquad(userId: string, squadId: string) {
  const squad = await db.squad.findUnique({ where: { id: squadId } });
  if (!squad) throw new AppError(ErrorCodes.NOT_FOUND, 'Squad not found', 404);
  if (squad.ownerId !== userId) throw new AppError(ErrorCodes.FORBIDDEN, 'Only the owner can disband the squad', 403);

  await db.squad.update({ where: { id: squadId }, data: { isActive: false } });
  return { disbanded: true };
}

export async function vouchForProfile(userId: string, squadId: string, targetUserId: string) {
  const membership = await db.squadMember.findUnique({
    where: { squadId_userId: { squadId, userId } },
    include: { squad: { include: { _count: { select: { members: true } } } } },
  });
  if (!membership?.squad.isActive) throw new AppError(ErrorCodes.NOT_FOUND, 'Squad not found', 404);
  if (membership.squad._count.members < SQUAD_UNLOCK_MEMBERS) {
    throw new AppError(ErrorCodes.FORBIDDEN, `Squad Discover unlocks at ${SQUAD_UNLOCK_MEMBERS} members`, 403);
  }

  const target = await db.profile.findUnique({ where: { userId: targetUserId } });
  if (!target) throw new AppError(ErrorCodes.NOT_FOUND, 'Profile not found', 404);

  await db.squadVouch.upsert({
    where: {
      squadId_userId_targetUserId: { squadId, userId, targetUserId },
    },
    create: { squadId, userId, targetUserId },
    update: {},
  });

  return { vouched: true };
}

export async function getSquadDiscoverFeed(userId: string, squadId: string): Promise<SquadDiscoverProfile[]> {
  const membership = await db.squadMember.findUnique({
    where: { squadId_userId: { squadId, userId } },
    include: { squad: { include: { _count: { select: { members: true } } } } },
  });
  if (!membership?.squad.isActive) throw new AppError(ErrorCodes.NOT_FOUND, 'Squad not found', 404);
  if (membership.squad._count.members < SQUAD_UNLOCK_MEMBERS) {
    throw new AppError(ErrorCodes.FORBIDDEN, `Squad Discover unlocks at ${SQUAD_UNLOCK_MEMBERS} members`, 403);
  }

  const memberIds = (
    await db.squadMember.findMany({
      where: { squadId },
      select: { userId: true },
    })
  ).map((m) => m.userId);

  const vouches = await db.squadVouch.findMany({
    where: { squadId, userId: { in: memberIds } },
    include: {
      user: { select: { profile: { select: { displayName: true } }, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const grouped = new Map<string, { vouchCount: number; vouchedBy: string[] }>();
  for (const v of vouches) {
    const entry = grouped.get(v.targetUserId) ?? { vouchCount: 0, vouchedBy: [] };
    entry.vouchCount += 1;
    const name = v.user.profile?.displayName ?? v.user.name ?? 'Friend';
    if (!entry.vouchedBy.includes(name)) entry.vouchedBy.push(name);
    grouped.set(v.targetUserId, entry);
  }

  const liked = await db.swipe.findMany({
    where: {
      fromUserId: { in: memberIds },
      action: 'LIKE',
      toUserId: { notIn: memberIds },
    },
    select: { toUserId: true, fromUserId: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  for (const s of liked) {
    const entry = grouped.get(s.toUserId) ?? { vouchCount: 0, vouchedBy: [] };
    grouped.set(s.toUserId, entry);
  }

  const targetIds = [...grouped.keys()].slice(0, 30);
  if (targetIds.length === 0) return [];

  const profiles = await db.profile.findMany({
    where: { userId: { in: targetIds } },
    select: { userId: true, displayName: true, photos: true, city: true },
  });

  return profiles
    .map((p) => {
      const meta = grouped.get(p.userId)!;
      return {
        userId: p.userId,
        displayName: p.displayName,
        photos: parseJsonArray(p.photos),
        city: p.city,
        vouchCount: meta.vouchCount,
        vouchedBy: meta.vouchedBy.slice(0, 3),
      };
    })
    .sort((a, b) => b.vouchCount - a.vouchCount);
}

export async function userHasSquadBoost(userId: string): Promise<boolean> {
  const memberships = await db.squadMember.findMany({
    where: { userId, squad: { isActive: true } },
    include: { squad: { include: { _count: { select: { members: true } } } } },
  });
  return memberships.some((m) => m.squad._count.members >= SQUAD_BOOST_MEMBERS);
}

/** Ensure referral code exists when user is created — called from auth flows */
export async function ensureUserReferralCode(userId: string, seedName?: string | null) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { referralCode: true } });
  if (user?.referralCode) return user.referralCode;
  const code = await generateUniqueReferralCode(seedName);
  await db.user.update({ where: { id: userId }, data: { referralCode: code } });
  return code;
}
