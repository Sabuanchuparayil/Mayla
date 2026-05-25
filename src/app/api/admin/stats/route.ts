import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { connectMongoDB } from '@/lib/mongodb';
import { Message } from '@/models/message.model';

export async function GET(req: NextRequest) {
  const role = req.headers.get('x-user-role');
  if (role !== 'ADMIN' && role !== 'MODERATOR') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    newUsersToday,
    verifiedUsers,
    activeMatches,
    newMatchesToday,
    pendingReports,
    pendingVerifications,
  ] = await Promise.all([
    db.user.count({ where: { isDeleted: false } }),
    db.user.count({ where: { isDeleted: false, createdAt: { gte: todayStart } } }),
    db.verification.count({ where: { status: 'APPROVED' } }),
    db.match.count({ where: { status: 'ACTIVE' } }),
    db.match.count({ where: { createdAt: { gte: todayStart } } }),
    db.report.count({ where: { status: 'PENDING' } }),
    db.verification.count({ where: { status: 'PENDING' } }),
  ]);

  await connectMongoDB();
  const messagesToday = await Message.countDocuments({
    createdAt: { $gte: todayStart },
  });

  return NextResponse.json({
    totalUsers,
    newUsersToday,
    verifiedUsers,
    activeMatches,
    newMatchesToday,
    messagesToday,
    pendingReports,
    pendingVerifications,
  });
}
