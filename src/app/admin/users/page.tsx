'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface AdminUser {
  id: string;
  phone: string | null;
  email: string | null;
  role: string;
  isBanned: boolean;
  createdAt: string;
  profile: { name: string } | null;
  verifications: { status: string }[];
}

interface UsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  hasMore: boolean;
}

export default function AdminUsersPage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banLoading, setBanLoading] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce the search query
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (debouncedQuery) params.set('q', debouncedQuery);
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData((await res.json()) as UsersResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, page]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const handleBan = async (userId: string, ban: boolean) => {
    setBanLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ban }),
      });
      if (!res.ok) throw new Error('Failed');
      await fetchUsers();
    } catch {
      alert('Action failed');
    } finally {
      setBanLoading(null);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-sm text-gray-500 mt-1">Search and manage users</p>
      </div>

      {/* Search */}
      <div className="mb-5 relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email, or phone..."
          className="w-full max-w-md pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-secondary-500/30 focus:border-secondary-500"
        />
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {loading ? (
        <div className="text-gray-500 text-sm">Loading...</div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {!data || data.users.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">No users found.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Contact</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Joined</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((user) => {
                    const isVerified = user.verifications.some((v) => v.status === 'APPROVED');
                    return (
                      <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {user.profile?.name ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          <div>{user.email ?? '—'}</div>
                          {user.phone && (
                            <div className="text-gray-400 text-xs">{user.phone}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'ADMIN'
                              ? 'bg-purple-50 text-purple-700'
                              : user.role === 'MODERATOR'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            {user.isBanned ? (
                              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                                Banned
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                Active
                              </span>
                            )}
                            {isVerified && (
                              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-secondary-50 text-secondary-700">
                                Verified
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          {user.isBanned ? (
                            <button
                              onClick={() => void handleBan(user.id, false)}
                              disabled={banLoading === user.id}
                              className="px-3 py-1 text-xs rounded-md bg-green-50 text-green-700 hover:bg-green-100 font-medium disabled:opacity-50"
                            >
                              {banLoading === user.id ? '...' : 'Unban'}
                            </button>
                          ) : (
                            <button
                              onClick={() => void handleBan(user.id, true)}
                              disabled={banLoading === user.id}
                              className="px-3 py-1 text-xs rounded-md bg-red-50 text-red-700 hover:bg-red-100 font-medium disabled:opacity-50"
                            >
                              {banLoading === user.id ? '...' : 'Ban'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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
              <span className="text-sm text-gray-500">
                Page {page} {data.total ? `· ${data.total} total` : ''}
              </span>
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
