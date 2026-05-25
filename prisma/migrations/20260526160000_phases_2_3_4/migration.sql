-- AlterTable profiles
ALTER TABLE "profiles" ADD COLUMN "profilePaused" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "incognitoMode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "ladiesFirstMessaging" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "dreamDates" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "openToDifferentCultures" TEXT,
ADD COLUMN "relocateWillingness" TEXT,
ADD COLUMN "lifestyleExpectations" TEXT,
ADD COLUMN "photoBlurUntilMatch" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "gentlemanScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'en';

-- AlterTable user_preferences
ALTER TABLE "user_preferences" ADD COLUMN "hideFromNationalities" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "hideFromCities" JSONB NOT NULL DEFAULT '[]';

-- CreateEnum
CREATE TYPE "GiftType" AS ENUM ('ROSE', 'COFFEE', 'DINNER_INVITE', 'WEEKEND_PACKAGE');
CREATE TYPE "GiftStatus" AS ENUM ('PENDING', 'SEEN', 'DECLINED');
CREATE TYPE "EventRsvpStatus" AS ENUM ('GOING', 'INTERESTED');

-- CreateTable push_subscriptions
CREATE TABLE "push_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "keys" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "push_subscriptions_userId_endpoint_key" ON "push_subscriptions"("userId", "endpoint");
CREATE INDEX "push_subscriptions_userId_idx" ON "push_subscriptions"("userId");
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable contact_hashes
CREATE TABLE "contact_hashes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phoneHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contact_hashes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "contact_hashes_userId_phoneHash_key" ON "contact_hashes"("userId", "phoneHash");
CREATE INDEX "contact_hashes_phoneHash_idx" ON "contact_hashes"("phoneHash");
ALTER TABLE "contact_hashes" ADD CONSTRAINT "contact_hashes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable virtual_gifts
CREATE TABLE "virtual_gifts" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "giftType" "GiftType" NOT NULL,
    "message" TEXT,
    "status" "GiftStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "virtual_gifts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "virtual_gifts_toUserId_status_idx" ON "virtual_gifts"("toUserId", "status");
CREATE INDEX "virtual_gifts_fromUserId_idx" ON "virtual_gifts"("fromUserId");
ALTER TABLE "virtual_gifts" ADD CONSTRAINT "virtual_gifts_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "virtual_gifts" ADD CONSTRAINT "virtual_gifts_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable community_events
CREATE TABLE "community_events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'AE',
    "category" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "maxAttendees" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "community_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "community_events_startsAt_idx" ON "community_events"("startsAt");
CREATE INDEX "community_events_city_idx" ON "community_events"("city");

-- CreateTable event_rsvps
CREATE TABLE "event_rsvps" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "EventRsvpStatus" NOT NULL DEFAULT 'GOING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "event_rsvps_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "event_rsvps_eventId_userId_key" ON "event_rsvps"("eventId", "userId");
CREATE INDEX "event_rsvps_userId_idx" ON "event_rsvps"("userId");
ALTER TABLE "event_rsvps" ADD CONSTRAINT "event_rsvps_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "community_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_rsvps" ADD CONSTRAINT "event_rsvps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
