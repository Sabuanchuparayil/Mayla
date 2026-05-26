-- Referral & Squad word-of-mouth growth system

ALTER TABLE "users" ADD COLUMN "referralCode" TEXT;
ALTER TABLE "users" ADD COLUMN "referralCodeCustomized" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "referralBadges" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "users" ADD COLUMN "priorityBoostUntil" TIMESTAMP(3);

CREATE UNIQUE INDEX "users_referralCode_key" ON "users"("referralCode");

CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'COMPLETED', 'EXPIRED');
CREATE TYPE "SquadRole" AS ENUM ('OWNER', 'MEMBER');

CREATE TABLE "referrals" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "rewardTier" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "squads" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "squads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "squad_members" (
    "id" TEXT NOT NULL,
    "squadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "SquadRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "squad_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "squad_vouches" (
    "id" TEXT NOT NULL,
    "squadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "squad_vouches_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "referrals_referredId_key" ON "referrals"("referredId");
CREATE INDEX "referrals_referrerId_idx" ON "referrals"("referrerId");
CREATE INDEX "referrals_code_idx" ON "referrals"("code");

CREATE UNIQUE INDEX "squads_code_key" ON "squads"("code");
CREATE INDEX "squads_ownerId_idx" ON "squads"("ownerId");

CREATE UNIQUE INDEX "squad_members_squadId_userId_key" ON "squad_members"("squadId", "userId");
CREATE INDEX "squad_members_userId_idx" ON "squad_members"("userId");

CREATE UNIQUE INDEX "squad_vouches_squadId_userId_targetUserId_key" ON "squad_vouches"("squadId", "userId", "targetUserId");
CREATE INDEX "squad_vouches_squadId_idx" ON "squad_vouches"("squadId");
CREATE INDEX "squad_vouches_targetUserId_idx" ON "squad_vouches"("targetUserId");

ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referredId_fkey" FOREIGN KEY ("referredId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "squads" ADD CONSTRAINT "squads_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "squad_members" ADD CONSTRAINT "squad_members_squadId_fkey" FOREIGN KEY ("squadId") REFERENCES "squads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "squad_members" ADD CONSTRAINT "squad_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "squad_vouches" ADD CONSTRAINT "squad_vouches_squadId_fkey" FOREIGN KEY ("squadId") REFERENCES "squads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "squad_vouches" ADD CONSTRAINT "squad_vouches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
