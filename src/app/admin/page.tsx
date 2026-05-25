import { redirect } from 'next/navigation';
import { requireServerUser } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { Card, CardHeader } from '@/components/ui/card';

export default async function AdminPage() {
  const user = await requireServerUser();
  if (user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const [userCount, matchCount, auditCount, reportCount, swipeCount] = await Promise.all([
    db.user.count(),
    db.match.count({ where: { status: 'ACCEPTED' } }),
    db.auditLog.count(),
    db.userReport.count({ where: { status: 'PENDING' } }),
    db.swipe.count(),
  ]);

  return (
    <div className="min-h-screen bg-zinc-50 p-8 dark:bg-black">
      <Card className="mx-auto max-w-4xl">
        <CardHeader title="Admin Dashboard" description="Mayla platform overview" />
        <dl className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <dt className="text-sm text-zinc-500">Users</dt>
            <dd className="text-2xl font-semibold">{userCount}</dd>
          </div>
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <dt className="text-sm text-zinc-500">Matches</dt>
            <dd className="text-2xl font-semibold">{matchCount}</dd>
          </div>
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <dt className="text-sm text-zinc-500">Pending reports</dt>
            <dd className="text-2xl font-semibold">{reportCount}</dd>
          </div>
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <dt className="text-sm text-zinc-500">Swipes</dt>
            <dd className="text-2xl font-semibold">{swipeCount}</dd>
          </div>
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <dt className="text-sm text-zinc-500">Audit logs</dt>
            <dd className="text-2xl font-semibold">{auditCount}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
