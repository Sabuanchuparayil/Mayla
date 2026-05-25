-- Migration: 20260525000000_init
-- Mayla dating app — initial schema

-- ─── Extensions ─────────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Enums ────────────────────────────────────────────────────────────────────────────────
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'MODERATOR');
CREATE TYPE "Gender" AS ENUM ('MAN', 'WOMAN', 'NON_BINARY', 'OTHER');
CREATE TYPE "SmokingStatus" AS ENUM ('NEVER', 'OCCASIONALLY', 'REGULARLY', 'TRYING_TO_QUIT');
CREATE TYPE "DrinkingStatus" AS ENUM ('NEVER', 'SOCIALLY', 'REGULARLY');
CREATE TYPE "RelationshipIntent" AS ENUM ('LONG_TERM', 'SHORT_TERM', 'CASUAL', 'FRIENDSHIP', 'NOT_SURE');
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "SwipeAction" AS ENUM ('LIKE', 'DISLIKE', 'SUPER_LIKE');
CREATE TYPE "MatchStatus" AS ENUM ('ACTIVE', 'UNMATCHED', 'BLOCKED');
CREATE TYPE "ReportCategory" AS ENUM ('FAKE_PROFILE', 'INAPPROPRIATE_CONTENT', 'HARASSMENT', 'SPAM', 'UNDERAGE', 'OTHER');
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED');
CREATE TYPE "SubscriptionPlan" AS ENUM ('BASIC', 'GOLD', 'PLATINUM');
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'EXPIRED', 'PAST_DUE');

-- ─── users ─────────────────────────────────────────────────────────────────────────────────
CREATE TABLE "users" (
    "id"              TEXT        NOT NULL,
    "email"           TEXT,
    "phone"           TEXT,
    "passwordHash"    TEXT,
    "role"            "UserRole"  NOT NULL DEFAULT 'USER',
    "isActive"        BOOLEAN     NOT NULL DEFAULT true,
    "isBanned"        BOOLEAN     NOT NULL DEFAULT false,
    "isDeleted"       BOOLEAN     NOT NULL DEFAULT false,
    "emailVerifiedAt" TIMESTAMP(3),
    "phoneVerifiedAt" TIMESTAMP(3),
    "lastSeenAt"      TIMESTAMP(3),
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt"       TIMESTAMP(3),
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key"  ON "users"("email");
CREATE UNIQUE INDEX "users_phone_key"  ON "users"("phone");
CREATE INDEX "users_email_idx"         ON "users"("email");
CREATE INDEX "users_phone_idx"         ON "users"("phone");
CREATE INDEX "users_active_idx"        ON "users"("isActive", "isDeleted", "isBanned");

-- ─── devices ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE "devices" (
    "id"         TEXT         NOT NULL,
    "userId"     TEXT         NOT NULL,
    "token"      TEXT         NOT NULL,
    "platform"   TEXT         NOT NULL,
    "deviceId"   TEXT         NOT NULL,
    "appVersion" TEXT,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "devices_token_key" ON "devices"("token");
CREATE INDEX "devices_userId_idx"       ON "devices"("userId");

-- ─── profiles ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE "profiles" (
    "id"                 TEXT         NOT NULL,
    "userId"             TEXT         NOT NULL,
    "name"               TEXT         NOT NULL,
    "bio"                TEXT,
    "birthDate"          TIMESTAMP(3) NOT NULL,
    "gender"             "Gender"     NOT NULL,
    "latitude"           DOUBLE PRECISION,
    "longitude"          DOUBLE PRECISION,
    "location"           geography(Point, 4326),
    "city"               TEXT,
    "country"            TEXT,
    "smokingStatus"      "SmokingStatus",
    "drinkingStatus"     "DrinkingStatus",
    "relationshipIntent" "RelationshipIntent",
    "height"             INTEGER,
    "occupation"         TEXT,
    "education"          TEXT,
    "interests"          TEXT[]        NOT NULL DEFAULT ARRAY[]::TEXT[],
    "minAgePreference"   INTEGER       NOT NULL DEFAULT 18,
    "maxAgePreference"   INTEGER       NOT NULL DEFAULT 99,
    "maxDistance"        INTEGER       NOT NULL DEFAULT 50,
    "genderPreference"   "Gender"[]    NOT NULL DEFAULT ARRAY[]::"Gender"[],
    "isVisible"          BOOLEAN       NOT NULL DEFAULT true,
    "isComplete"         BOOLEAN       NOT NULL DEFAULT false,
    "createdAt"          TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"          TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "profiles_userId_key"      ON "profiles"("userId");
CREATE INDEX "profiles_userId_idx"             ON "profiles"("userId");
CREATE INDEX "profiles_gender_idx"             ON "profiles"("gender");
CREATE INDEX "profiles_visible_complete_idx"   ON "profiles"("isVisible", "isComplete");
-- GiST index for fast radius / nearest-neighbour spatial queries
CREATE INDEX "profiles_location_gist_idx"      ON "profiles" USING GIST ("location");

-- ─── photos ────────────────────────────────────────────────────────────────────────────────
CREATE TABLE "photos" (
    "id"         TEXT         NOT NULL,
    "userId"     TEXT         NOT NULL,
    "url"        TEXT         NOT NULL,
    "storageKey" TEXT         NOT NULL,
    "order"      INTEGER      NOT NULL DEFAULT 0,
    "isMain"     BOOLEAN      NOT NULL DEFAULT false,
    "isVerified" BOOLEAN      NOT NULL DEFAULT false,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "photos_storageKey_key"  ON "photos"("storageKey");
CREATE INDEX "photos_userId_idx"             ON "photos"("userId");
CREATE INDEX "photos_userId_order_idx"       ON "photos"("userId", "order");

-- ─── prompts ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE "prompts" (
    "id"        TEXT         NOT NULL,
    "question"  TEXT         NOT NULL,
    "category"  TEXT,
    "isActive"  BOOLEAN      NOT NULL DEFAULT true,
    "order"     INTEGER      NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "prompts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "prompts_isActive_idx" ON "prompts"("isActive");

-- ─── profile_prompts ──────────────────────────────────────────────────────────────────────────
CREATE TABLE "profile_prompts" (
    "id"        TEXT         NOT NULL,
    "profileId" TEXT         NOT NULL,
    "promptId"  TEXT         NOT NULL,
    "answer"    TEXT         NOT NULL,
    "order"     INTEGER      NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "profile_prompts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "profile_prompts_profileId_promptId_key" ON "profile_prompts"("profileId", "promptId");
CREATE INDEX "profile_prompts_profileId_idx"                 ON "profile_prompts"("profileId");

-- ─── verifications ───────────────────────────────────────────────────────────────────────────
CREATE TABLE "verifications" (
    "id"               TEXT                 NOT NULL,
    "userId"           TEXT                 NOT NULL,
    "status"           "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "selfieUrl"        TEXT,
    "selfieStorageKey" TEXT,
    "embedding"        DOUBLE PRECISION[]   NOT NULL DEFAULT ARRAY[]::DOUBLE PRECISION[],
    "verifiedAt"       TIMESTAMP(3),
    "rejectedReason"   TEXT,
    "createdAt"        TIMESTAMP(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "verifications_userId_idx" ON "verifications"("userId");
CREATE INDEX "verifications_status_idx" ON "verifications"("status");

-- ─── swipes ─────────────────────────────────────────────────────────────────────────────────
CREATE TABLE "swipes" (
    "id"        TEXT          NOT NULL,
    "swiperId"  TEXT          NOT NULL,
    "swipedId"  TEXT          NOT NULL,
    "action"    "SwipeAction" NOT NULL,
    "createdAt" TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "swipes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "swipes_swiperId_swipedId_key" ON "swipes"("swiperId", "swipedId");
CREATE INDEX "swipes_swiperId_idx"                 ON "swipes"("swiperId");
CREATE INDEX "swipes_swipedId_idx"                 ON "swipes"("swipedId");
CREATE INDEX "swipes_swiperId_action_idx"           ON "swipes"("swiperId", "action");

-- ─── matches ─────────────────────────────────────────────────────────────────────────────────
CREATE TABLE "matches" (
    "id"            TEXT          NOT NULL,
    "user1Id"       TEXT          NOT NULL,
    "user2Id"       TEXT          NOT NULL,
    "status"        "MatchStatus" NOT NULL DEFAULT 'ACTIVE',
    "matchedAt"     TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unmatchedAt"   TIMESTAMP(3),
    "unmatchedById" TEXT,
    "createdAt"     TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "matches_user1Id_user2Id_key" ON "matches"("user1Id", "user2Id");
CREATE INDEX "matches_user1Id_idx"                ON "matches"("user1Id");
CREATE INDEX "matches_user2Id_idx"                ON "matches"("user2Id");
CREATE INDEX "matches_status_idx"                 ON "matches"("status");

-- ─── reports ─────────────────────────────────────────────────────────────────────────────────
CREATE TABLE "reports" (
    "id"           TEXT             NOT NULL,
    "reporterId"   TEXT             NOT NULL,
    "reportedId"   TEXT             NOT NULL,
    "category"     "ReportCategory" NOT NULL,
    "status"       "ReportStatus"   NOT NULL DEFAULT 'PENDING',
    "description"  TEXT,
    "reviewedAt"   TIMESTAMP(3),
    "reviewedById" TEXT,
    "createdAt"    TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "reports_reporterId_idx" ON "reports"("reporterId");
CREATE INDEX "reports_reportedId_idx" ON "reports"("reportedId");
CREATE INDEX "reports_status_idx"      ON "reports"("status");

-- ─── blocks ─────────────────────────────────────────────────────────────────────────────────
CREATE TABLE "blocks" (
    "id"        TEXT         NOT NULL,
    "blockerId" TEXT         NOT NULL,
    "blockedId" TEXT         NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "blocks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "blocks_blockerId_blockedId_key" ON "blocks"("blockerId", "blockedId");
CREATE INDEX "blocks_blockerId_idx"                  ON "blocks"("blockerId");
CREATE INDEX "blocks_blockedId_idx"                  ON "blocks"("blockedId");

-- ─── subscriptions ───────────────────────────────────────────────────────────────────────────
CREATE TABLE "subscriptions" (
    "id"                   TEXT                 NOT NULL,
    "userId"               TEXT                 NOT NULL,
    "plan"                 "SubscriptionPlan"   NOT NULL,
    "status"               "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "stripeSubscriptionId" TEXT,
    "stripeCustomerId"     TEXT,
    "currentPeriodStart"   TIMESTAMP(3)         NOT NULL,
    "currentPeriodEnd"     TIMESTAMP(3)         NOT NULL,
    "cancelledAt"          TIMESTAMP(3),
    "createdAt"            TIMESTAMP(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"            TIMESTAMP(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "subscriptions_stripeSubscriptionId_key" ON "subscriptions"("stripeSubscriptionId");
CREATE INDEX "subscriptions_userId_idx"                      ON "subscriptions"("userId");
CREATE INDEX "subscriptions_status_idx"                      ON "subscriptions"("status");
CREATE INDEX "subscriptions_stripe_idx"                      ON "subscriptions"("stripeSubscriptionId");

-- ─── purchases ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE "purchases" (
    "id"                    TEXT         NOT NULL,
    "userId"                TEXT         NOT NULL,
    "productId"             TEXT         NOT NULL,
    "productType"           TEXT         NOT NULL,
    "stripePaymentIntentId" TEXT,
    "amount"                INTEGER      NOT NULL,
    "currency"              TEXT         NOT NULL DEFAULT 'usd',
    "metadata"              JSONB,
    "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "purchases_stripePaymentIntentId_key" ON "purchases"("stripePaymentIntentId");
CREATE INDEX "purchases_userId_idx"                       ON "purchases"("userId");
CREATE INDEX "purchases_stripe_idx"                       ON "purchases"("stripePaymentIntentId");

-- ─── Foreign keys ───────────────────────────────────────────────────────────────────────────
ALTER TABLE "devices"
    ADD CONSTRAINT "devices_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "profiles"
    ADD CONSTRAINT "profiles_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "photos"
    ADD CONSTRAINT "photos_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "profile_prompts"
    ADD CONSTRAINT "profile_prompts_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "profile_prompts"
    ADD CONSTRAINT "profile_prompts_promptId_fkey"
    FOREIGN KEY ("promptId") REFERENCES "prompts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "verifications"
    ADD CONSTRAINT "verifications_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "swipes"
    ADD CONSTRAINT "swipes_swiperId_fkey"
    FOREIGN KEY ("swiperId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "swipes"
    ADD CONSTRAINT "swipes_swipedId_fkey"
    FOREIGN KEY ("swipedId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "matches"
    ADD CONSTRAINT "matches_user1Id_fkey"
    FOREIGN KEY ("user1Id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "matches"
    ADD CONSTRAINT "matches_user2Id_fkey"
    FOREIGN KEY ("user2Id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reports"
    ADD CONSTRAINT "reports_reporterId_fkey"
    FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reports"
    ADD CONSTRAINT "reports_reportedId_fkey"
    FOREIGN KEY ("reportedId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "blocks"
    ADD CONSTRAINT "blocks_blockerId_fkey"
    FOREIGN KEY ("blockerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "blocks"
    ADD CONSTRAINT "blocks_blockedId_fkey"
    FOREIGN KEY ("blockedId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "subscriptions"
    ADD CONSTRAINT "subscriptions_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "purchases"
    ADD CONSTRAINT "purchases_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
