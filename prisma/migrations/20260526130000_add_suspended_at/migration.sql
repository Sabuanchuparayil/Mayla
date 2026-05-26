-- AlterTable
ALTER TABLE "users" ADD COLUMN "suspendedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "users_suspendedAt_idx" ON "users"("suspendedAt");
