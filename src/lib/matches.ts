import { db } from '@/lib/db';
import { MatchStatus } from '@/generated/prisma/enums';

export async function createMatch(userId1: string, userId2: string): Promise<string> {
  // Ensure consistent ordering to satisfy unique constraint
  const sorted = [userId1, userId2].sort();
  const u1 = sorted[0]!;
  const u2 = sorted[1]!;
  const match = await db.match.create({
    data: {
      user1Id: u1,
      user2Id: u2,
      status: MatchStatus.ACTIVE,
    },
  });
  return match.id;
}
