-- AlterTable
ALTER TABLE "profiles" ADD COLUMN "availableDay" TEXT,
ADD COLUMN "availableTime" TEXT,
ADD COLUMN "availableExpiry" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "profiles_availableExpiry_idx" ON "profiles"("availableExpiry");

-- CreateEnum
CREATE TYPE "DateRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- CreateTable
CREATE TABLE "date_requests" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "message" TEXT,
    "proposedDay" TEXT,
    "proposedTime" TEXT,
    "status" "DateRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "date_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "date_requests_fromUserId_idx" ON "date_requests"("fromUserId");

-- CreateIndex
CREATE INDEX "date_requests_toUserId_idx" ON "date_requests"("toUserId");

-- CreateIndex
CREATE INDEX "date_requests_status_idx" ON "date_requests"("status");

-- AddForeignKey
ALTER TABLE "date_requests" ADD CONSTRAINT "date_requests_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "date_requests" ADD CONSTRAINT "date_requests_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
