-- CreateEnum
CREATE TYPE "RelationshipGoal" AS ENUM (
  'MARRIAGE',
  'LIFE_PARTNER',
  'RELATIONSHIP',
  'CASUAL_DATING',
  'COMPANIONSHIP',
  'SOCIAL_FUN',
  'RATHER_NOT_SAY'
);

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "nationality" TEXT;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "languages" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "education" TEXT;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "jobTitle" TEXT;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "industry" TEXT;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "relationshipGoal" "RelationshipGoal";
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "lifestyle" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "smoking" TEXT;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "drinking" TEXT;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "exercise" TEXT;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "height" INTEGER;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "personalityPrompts" JSONB NOT NULL DEFAULT '[]';

-- CreateIndex
CREATE INDEX IF NOT EXISTS "profiles_relationshipGoal_idx" ON "profiles"("relationshipGoal");

-- CreateTable
CREATE TABLE IF NOT EXISTS "user_preferences" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "genderPref" JSONB NOT NULL DEFAULT '[]',
  "ageMin" INTEGER,
  "ageMax" INTEGER,
  "nationalities" JSONB NOT NULL DEFAULT '[]',
  "languages" JSONB NOT NULL DEFAULT '[]',
  "maxDistanceKm" INTEGER NOT NULL DEFAULT 100,
  "relationshipGoals" JSONB NOT NULL DEFAULT '[]',
  "dealbreakers" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "user_preferences_userId_key" ON "user_preferences"("userId");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
