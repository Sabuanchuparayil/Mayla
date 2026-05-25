'use client';

import { useState, useEffect, useCallback } from 'react';
import CategoryPill from '@/components/admin/CategoryPill';

type ReportStatus = 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';

interface Report {
  id: string;
  category: string;
  status: string;
  description: string | null;
  createdAt: string;
  reporter: { id: string; profile: { name: string } | null };
  reported: {
    id: string;
    isBanned: boolean;
    profile: { name: string } | null;
    photos: { url: string }[];
  };
}

interface ReportsResponse {
  reports: Report[];
  total: number;
  page: number;
  hasMore: boolean;
}

const TABS: ReportStatus[] = ['PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED'];

async function patchReport(payload: {
  reportId: string;
  action: string;
  banReported?: boolean;
}) {
  const res = await fetch('/api/admin/reports', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Action failed');
}

export default function AdminReportsPage() {
  const [tab, setTab] = useState<ReportStatus>('PENDING');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ReportsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reports?status=${tab}&page=${page}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData((await res.json()) as ReportsResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  const handleAction = async (
    reportId: string,
    action: string,
    banReported?: boolean,
  ) => {
    setActionLoading(reportId + action);
    try {
      await patchReport({ reportId, action, banReported });
      await fetchReports();
    } catch {
      alert('Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleTabChange = (newTab: ReportStatus) => {
    setTab(newTab);
    setPage(1);
    setData(null);
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Review and act on user reports</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-white border border-gray-200 rounded-lg p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => handleTabChange(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {t.charAt(0) + t.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {loading ? (
        <div className="text-gray-500 text-sm">Loading...</div>
      ) : (
        <>
          {/* Reports list */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {!data || data.reports.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">No reports found.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Reporter</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Reported</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 max-w-xs">Description</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.reports.map((report) => (
                    <tr key={report.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-700">
                        {report.reporter.profile?.name ?? 'Unknown'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {report.reported.photos[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={report.reported.photos[0].url}
                              alt="photo"
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
                          )}
                          <span className="text-gray-700">
                            {report.reported.profile?.name ?? 'Unknown'}
                          </span>
                          {report.reported.isBanned && (
                            <span className="text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                              Banned
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <CategoryPill category={report.category} />
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs">
                        <span className="line-clamp-2">
                          {report.description ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <ReportActions
                          report={report}
                          tab={tab}
                          actionLoading={actionLoading}
                          onAction={handleAction}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {data && (data.page > 1 || data.hasMore) && (
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">Page {page}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!data.hasMore}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ReportActions({
  report,
  tab,
  actionLoading,
  onAction,
}: {
  report: Report;
  tab: ReportStatus;
  actionLoading: string | null;
  onAction: (id: string, action: string, ban?: boolean) => Promise<void>;
}) {
  const isLoading = (id: string, action: string) => actionLoading === id + action;
  const canAct = tab === 'PENDING' || tab === 'REVIEWED';

  return (
    <div className="flex flex-wrap gap-1.5">
      {tab === 'PENDING' && (
        <button
          onClick={() => void onAction(report.id, 'REVIEWED')}
          disabled={isLoading(report.id, 'REVIEWED')}
          className="px-2.5 py-1 text-xs rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50"
        >
          Review
        </button>
      )}
      {canAct && (
        <>
          <button
            onClick={() => void onAction(report.id, 'RESOLVED')}
            disabled={isLoading(report.id, 'RESOLVED')}
            className="px-2.5 py-1 text-xs rounded-md bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50"
          >
            Resolve
          </button>
          <button
            onClick={() => void onAction(report.id, 'DISMISSED')}
            disabled={isLoading(report.id, 'DISMISSED')}
            className="px-2.5 py-1 text-xs rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
          >
            Dismiss
          </button>
          {!report.reported.isBanned && (
            <button
              onClick={() => void onAction(report.id, 'RESOLVED', true)}
              disabled={isLoading(report.id, 'RESOLVEDBAN')}
              className="px-2.5 py-1 text-xs rounded-md bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              Ban User
            </button>
          )}
        </>
      )}
    </div>
  );
}
