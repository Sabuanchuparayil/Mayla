import { cookies } from 'next/headers';

interface AdminStats {
  totalUsers: number;
  newUsersToday: number;
  verifiedUsers: number;
  activeMatches: number;
  newMatchesToday: number;
  messagesToday: number;
  pendingReports: number;
  pendingVerifications: number;
}

function StatCard({
  icon,
  value,
  label,
  highlight,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border p-5 flex items-start gap-4 ${
        highlight && value > 0 ? 'border-red-200' : 'border-gray-100'
      }`}
    >
      <div
        className={`p-2 rounded-lg ${
          highlight && value > 0 ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-500'
        }`}
      >
        {icon}
      </div>
      <div>
        <div
          className={`text-2xl font-bold ${
            highlight && value > 0 ? 'text-red-600' : 'text-gray-900'
          }`}
        >
          {value.toLocaleString()}
        </div>
        <div className="text-sm text-gray-500 mt-0.5">{label}</div>
        {highlight && value > 0 && (
          <span className="inline-block mt-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
            Needs attention
          </span>
        )}
      </div>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  let stats: AdminStats | null = null;
  let error: string | null = null;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    stats = (await res.json()) as AdminStats;
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load stats';
  }

  if (error || !stats) {
    return (
      <div className="p-8">
        <p className="text-red-600">Failed to load stats: {error}</p>
      </div>
    );
  }

  const cards = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
      value: stats.totalUsers,
      label: 'Total Users',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
          />
        </svg>
      ),
      value: stats.newUsersToday,
      label: 'New Today',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      value: stats.verifiedUsers,
      label: 'Verified Users',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      ),
      value: stats.activeMatches,
      label: 'Active Matches',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      ),
      value: stats.newMatchesToday,
      label: 'New Matches Today',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      ),
      value: stats.messagesToday,
      label: 'Messages Today',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
      value: stats.pendingReports,
      label: 'Pending Reports',
      highlight: true,
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
      ),
      value: stats.pendingVerifications,
      label: 'Pending Verifications',
      highlight: true,
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of platform activity</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>
    </div>
  );
}
