import { redirect } from 'next/navigation';
import { requireServerUser } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { AdminDashboard } from '@/components/admin/admin-dashboard';

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
    <div className="min-h-screen p-4 md:p-8">
      <AdminDashboard
        initialStats={{
          userCount,
          matchCount,
          auditCount,
          reportCount,
          swipeCount,
        }}
      />
    </div>
  );
}
