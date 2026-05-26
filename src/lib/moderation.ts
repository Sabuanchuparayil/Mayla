import { db } from '@/lib/db';

export async function blockUser(blockerId: string, blockedId: string) {
  if (blockerId === blockedId) return;
  await db.userBlock.upsert({
    where: { blockerId_blockedId: { blockerId, blockedId } },
    create: { blockerId, blockedId },
    update: {},
  });
}

export async function reportUser(
  reporterId: string,
  reportedId: string,
  reason: string,
  details?: string,
) {
  const report = await db.userReport.create({
    data: { reporterId, reportedId, reason, details },
  });

  const { recordReportAgainst, scheduleGentlemanScoreRefresh } = await import('@/lib/gentleman-score');
  await recordReportAgainst(reportedId);
  scheduleGentlemanScoreRefresh(reportedId);

  return report;
}

export async function listPendingReports(limit = 50) {
  return db.userReport.findMany({
    where: { status: 'PENDING' },
    include: {
      reporter: { select: { id: true, email: true, name: true } },
      reported: { select: { id: true, email: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function resolveReport(
  reportId: string,
  action: 'DISMISS' | 'WARN' | 'BAN',
) {
  const report = await db.userReport.findUnique({ where: { id: reportId } });
  if (!report) return null;

  if (action === 'DISMISS') {
    return db.userReport.update({
      where: { id: reportId },
      data: { status: 'DISMISSED' },
    });
  }

  if (action === 'WARN' || action === 'BAN') {
    const { recordReportAgainst, scheduleGentlemanScoreRefresh } = await import('@/lib/gentleman-score');
    await recordReportAgainst(report.reportedId);
    scheduleGentlemanScoreRefresh(report.reportedId);
    if (action === 'BAN') {
      await db.user.update({
        where: { id: report.reportedId },
        data: { onboardingCompleted: false },
      });
    }
    return db.userReport.update({
      where: { id: reportId },
      data: { status: 'REVIEWED' },
    });
  }

  return report;
}
