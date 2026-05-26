'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api/client';

type Tab = 'overview' | 'users' | 'subscriptions' | 'referrals' | 'squads' | 'events' | 'reports' | 'audit';

type Stats = {
  users: { totalUsers: number; verifiedUsers: number; onboardedUsers: number; newUsersToday: number; newUsersWeek: number };
  engagement: { totalMatches: number; matchesWeek: number; totalSwipes: number; swipesToday: number };
  moderation: { pendingReports: number };
  revenue: { totalSubscriptions: number; goldSubs: number; platinumSubs: number; freeUsers: number };
  growth: { totalReferrals: number; completedReferrals: number; conversionRate: number };
  community: { totalSquads: number; activeSquads: number; totalEvents: number };
};

type UserRow = {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  username: string | null;
  role: string;
  verified: boolean;
  onboardingCompleted: boolean;
  suspendedAt: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  referralCode: string | null;
  subscription: { tier: string; status: string; expiresAt: string | null } | null;
  profile: { displayName: string; gender: string | null; city: string | null; country: string } | null;
  _count: { referralsMade: number; swipesFrom: number; matchesAsA: number; matchesAsB: number; reportsReceived: number; squadMemberships: number };
};

type SubscriptionRow = {
  id: string;
  userId: string;
  tier: string;
  status: string;
  expiresAt: string | null;
  user: { id: string; email: string | null; name: string | null; phone: string | null };
};

type ReferralRow = {
  id: string;
  code: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
  referrer: { id: string; name: string | null; email: string | null; referralCode: string | null };
  referred: { id: string; name: string | null; email: string | null; createdAt: string };
};

type SquadRow = {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  owner: { id: string; name: string | null; email: string | null };
  _count: { members: number; vouches: number };
};

type AuditRow = {
  id: string;
  action: string;
  resource: string | null;
  ip: string | null;
  createdAt: string;
  user: { id: string; email: string | null; name: string | null } | null;
};

type EventRow = {
  id: string;
  title: string;
  city: string;
  category: string;
  startsAt: string;
  maxAttendees: number | null;
  _count: { rsvps: number };
};

type ReportRow = {
  id: string;
  reason: string;
  details: string | null;
  createdAt: string;
  reporter: { name: string | null; email: string | null };
  reported: { name: string | null; email: string | null };
};

type LeaderboardEntry = {
  id?: string;
  name?: string | null;
  email?: string | null;
  referralCode?: string | null;
  completedCount: number;
};

export function AdminDashboard({ initialStats }: { initialStats: { userCount: number; matchCount: number; reportCount: number; swipeCount: number; auditCount: number } }) {
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [message, setMessage] = useState('');

  const [users, setUsers] = useState<UserRow[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userTotal, setUserTotal] = useState(0);

  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
  const [subFilter, setSubFilter] = useState('');
  const [tierCounts, setTierCounts] = useState({ FREE: 0, GOLD: 0, PLATINUM: 0 });

  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [refStats, setRefStats] = useState({ total: 0, completed: 0, pending: 0 });

  const [squads, setSquads] = useState<SquadRow[]>([]);
  const [squadStats, setSquadStats] = useState({ total: 0, active: 0 });

  const [auditLogs, setAuditLogs] = useState<AuditRow[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotal, setAuditTotal] = useState(0);

  const [events, setEvents] = useState<EventRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [eventForm, setEventForm] = useState({ title: '', description: '', city: 'Dubai', country: 'AE', category: 'Social', startsAt: '', maxAttendees: '' });

  useEffect(() => {
    if (tab === 'overview') {
      apiFetch<Stats>('/api/admin/stats').then((r) => { if (r.success) setStats(r.data); });
    }
  }, [tab]);

  useEffect(() => {
    if (tab === 'users') loadUsers();
  }, [tab, userPage]);

  useEffect(() => {
    if (tab === 'subscriptions') {
      const q = subFilter ? `?tier=${subFilter}` : '';
      apiFetch<{ subscriptions: SubscriptionRow[]; tierCounts: typeof tierCounts }>(`/api/admin/subscriptions${q}`).then((r) => {
        if (r.success) { setSubscriptions(r.data.subscriptions); setTierCounts(r.data.tierCounts); }
      });
    }
  }, [tab, subFilter]);

  useEffect(() => {
    if (tab === 'referrals') {
      apiFetch<{ referrals: ReferralRow[]; leaderboard: LeaderboardEntry[]; total: number; completedCount: number; pendingCount: number }>('/api/admin/referrals').then((r) => {
        if (r.success) { setReferrals(r.data.referrals); setLeaderboard(r.data.leaderboard); setRefStats({ total: r.data.total, completed: r.data.completedCount, pending: r.data.pendingCount }); }
      });
    }
  }, [tab]);

  useEffect(() => {
    if (tab === 'squads') {
      apiFetch<{ squads: SquadRow[]; total: number; activeSquads: number }>('/api/admin/squads').then((r) => {
        if (r.success) { setSquads(r.data.squads); setSquadStats({ total: r.data.total, active: r.data.activeSquads }); }
      });
    }
  }, [tab]);

  useEffect(() => {
    if (tab === 'audit') loadAudit();
  }, [tab, auditPage]);

  useEffect(() => {
    if (tab === 'events') apiFetch<{ events: EventRow[] }>('/api/admin/events').then((r) => { if (r.success) setEvents(r.data.events); });
    if (tab === 'reports') apiFetch<{ reports: ReportRow[] }>('/api/admin/reports').then((r) => { if (r.success) setReports(r.data.reports); });
  }, [tab]);

  function loadUsers() {
    const q = userSearch ? `&q=${encodeURIComponent(userSearch)}` : '';
    apiFetch<{ users: UserRow[]; total: number }>(`/api/admin/users?page=${userPage}${q}`).then((r) => {
      if (r.success) { setUsers(r.data.users); setUserTotal(r.data.total); }
    });
  }

  function loadAudit() {
    apiFetch<{ logs: AuditRow[]; total: number }>(`/api/admin/audit-logs?page=${auditPage}`).then((r) => {
      if (r.success) { setAuditLogs(r.data.logs); setAuditTotal(r.data.total); }
    });
  }

  function toast(msg: string) { setMessage(msg); setTimeout(() => setMessage(''), 3000); }

  async function updateUser(id: string, data: Record<string, unknown>) {
    const r = await apiFetch(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    if (r.success) { toast('User updated'); loadUsers(); }
  }

  async function deleteUser(id: string) {
    if (!confirm('Permanently delete this user? This cannot be undone.')) return;
    const r = await apiFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    if (r.success) { toast('User deleted'); loadUsers(); }
  }

  async function createEvent() {
    const r = await apiFetch('/api/admin/events', { method: 'POST', body: JSON.stringify({ ...eventForm, startsAt: new Date(eventForm.startsAt).toISOString(), maxAttendees: eventForm.maxAttendees ? Number(eventForm.maxAttendees) : undefined }) });
    if (r.success) { toast('Event created'); setEventForm({ ...eventForm, title: '', description: '', startsAt: '' }); apiFetch<{ events: EventRow[] }>('/api/admin/events').then((e) => { if (e.success) setEvents(e.data.events); }); }
  }

  async function deleteEvent(id: string) {
    if (!confirm('Delete this event?')) return;
    await apiFetch(`/api/admin/events/${id}`, { method: 'DELETE' });
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  async function resolveReport(id: string, action: 'DISMISS' | 'WARN' | 'BAN') {
    await apiFetch(`/api/admin/reports/${id}`, { method: 'PATCH', body: JSON.stringify({ action }) });
    setReports((prev) => prev.filter((r) => r.id !== id));
    toast(`Report ${action.toLowerCase()}ed`);
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'Users' },
    { id: 'subscriptions', label: 'Billing' },
    { id: 'referrals', label: 'Referrals' },
    { id: 'squads', label: 'Squads' },
    { id: 'events', label: 'Events' },
    { id: 'reports', label: 'Reports' },
    { id: 'audit', label: 'Audit Logs' },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Card>
        <CardHeader title="Admin Dashboard" description="Mayla platform management" />
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <Button key={t.id} size="sm" variant={tab === t.id ? 'primary' : 'outline'} onClick={() => setTab(t.id)}>
              {t.label}
              {t.id === 'reports' && initialStats.reportCount > 0 ? ` (${initialStats.reportCount})` : ''}
            </Button>
          ))}
        </div>
      </Card>

      {tab === 'overview' && stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard title="Users" items={[
            { label: 'Total', value: stats.users.totalUsers },
            { label: 'Verified', value: stats.users.verifiedUsers },
            { label: 'Onboarded', value: stats.users.onboardedUsers },
            { label: 'New today', value: stats.users.newUsersToday },
            { label: 'New this week', value: stats.users.newUsersWeek },
          ]} />
          <StatCard title="Engagement" items={[
            { label: 'Matches', value: stats.engagement.totalMatches },
            { label: 'Matches (7d)', value: stats.engagement.matchesWeek },
            { label: 'Swipes', value: stats.engagement.totalSwipes },
            { label: 'Swipes today', value: stats.engagement.swipesToday },
          ]} />
          <StatCard title="Revenue" items={[
            { label: 'Gold subs', value: stats.revenue.goldSubs },
            { label: 'Platinum subs', value: stats.revenue.platinumSubs },
            { label: 'Free users', value: stats.revenue.freeUsers },
          ]} />
          <StatCard title="Growth (Referrals)" items={[
            { label: 'Total referrals', value: stats.growth.totalReferrals },
            { label: 'Completed', value: stats.growth.completedReferrals },
            { label: 'Conversion', value: `${stats.growth.conversionRate}%` },
          ]} />
          <StatCard title="Community" items={[
            { label: 'Squads', value: stats.community.activeSquads },
            { label: 'Events', value: stats.community.totalEvents },
          ]} />
          <StatCard title="Moderation" items={[
            { label: 'Pending reports', value: stats.moderation.pendingReports },
          ]} />
        </div>
      ) : tab === 'overview' ? <Card><p className="text-sm text-muted-foreground">Loading stats...</p></Card> : null}

      {tab === 'users' ? (
        <Card>
          <CardHeader title={`Users (${userTotal})`} />
          <div className="mb-4 flex gap-2">
            <Input placeholder="Search email, name, phone…" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
            <Button variant="outline" onClick={() => { setUserPage(1); loadUsers(); }}>Search</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-card-border text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-3">Name</th><th className="pb-2 pr-3">Email/Phone</th><th className="pb-2 pr-3">Tier</th><th className="pb-2 pr-3">Verified</th><th className="pb-2 pr-3">Referrals</th><th className="pb-2 pr-3">Matches</th><th className="pb-2 pr-3">Actions</th>
              </tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-card-border/50">
                    <td className="py-2 pr-3 font-medium">{u.profile?.displayName ?? u.name ?? '—'}</td>
                    <td className="py-2 pr-3 text-xs">{u.email ?? u.phone ?? '—'}</td>
                    <td className="py-2 pr-3"><TierBadge tier={u.subscription?.tier ?? 'FREE'} /></td>
                    <td className="py-2 pr-3">{u.verified ? '✓' : '—'}</td>
                    <td className="py-2 pr-3">{u._count.referralsMade}</td>
                    <td className="py-2 pr-3">{u._count.matchesAsA + u._count.matchesAsB}</td>
                    <td className="py-2 pr-3 space-x-1">
                      {!u.verified ? <Button size="sm" variant="outline" onClick={() => void updateUser(u.id, { verified: true })}>Verify</Button> : null}
                      {u.role !== 'ADMIN' && !u.suspendedAt ? <Button size="sm" variant="outline" onClick={() => void updateUser(u.id, { suspended: true })}>Suspend</Button> : null}
                      {u.role !== 'ADMIN' && u.suspendedAt ? <Button size="sm" variant="outline" onClick={() => void updateUser(u.id, { unsuspend: true })}>Unsuspend</Button> : null}
                      {u.role !== 'ADMIN' ? <Button size="sm" variant="danger" onClick={() => void deleteUser(u.id)}>Delete</Button> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-between">
            <Button size="sm" variant="outline" disabled={userPage <= 1} onClick={() => setUserPage((p) => p - 1)}>Previous</Button>
            <span className="text-xs text-muted-foreground">Page {userPage}</span>
            <Button size="sm" variant="outline" onClick={() => setUserPage((p) => p + 1)}>Next</Button>
          </div>
        </Card>
      ) : null}

      {tab === 'subscriptions' ? (
        <Card>
          <CardHeader title="Subscriptions" />
          <div className="mb-4 flex flex-wrap gap-2">
            <Button size="sm" variant={!subFilter ? 'primary' : 'outline'} onClick={() => setSubFilter('')}>All ({tierCounts.FREE + tierCounts.GOLD + tierCounts.PLATINUM})</Button>
            <Button size="sm" variant={subFilter === 'FREE' ? 'primary' : 'outline'} onClick={() => setSubFilter('FREE')}>Free ({tierCounts.FREE})</Button>
            <Button size="sm" variant={subFilter === 'GOLD' ? 'primary' : 'outline'} onClick={() => setSubFilter('GOLD')}>Gold ({tierCounts.GOLD})</Button>
            <Button size="sm" variant={subFilter === 'PLATINUM' ? 'primary' : 'outline'} onClick={() => setSubFilter('PLATINUM')}>Platinum ({tierCounts.PLATINUM})</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-card-border text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-3">User</th><th className="pb-2 pr-3">Tier</th><th className="pb-2 pr-3">Status</th><th className="pb-2 pr-3">Expires</th>
              </tr></thead>
              <tbody>
                {subscriptions.map((s) => (
                  <tr key={s.id} className="border-b border-card-border/50">
                    <td className="py-2 pr-3">{s.user.name ?? s.user.email ?? s.user.phone}</td>
                    <td className="py-2 pr-3"><TierBadge tier={s.tier} /></td>
                    <td className="py-2 pr-3">{s.status}</td>
                    <td className="py-2 pr-3 text-xs">{s.expiresAt ? new Date(s.expiresAt).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      {tab === 'referrals' ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card><Stat label="Total referrals" value={refStats.total} /></Card>
            <Card><Stat label="Completed" value={refStats.completed} /></Card>
            <Card><Stat label="Pending" value={refStats.pending} /></Card>
          </div>
          {leaderboard.length > 0 ? (
            <Card>
              <CardHeader title="Top referrers" />
              <div className="space-y-2">
                {leaderboard.map((entry, i) => (
                  <div key={entry.id ?? i} className="flex items-center justify-between rounded-lg border border-card-border p-3">
                    <div>
                      <span className="mr-2 text-lg font-bold text-primary">#{i + 1}</span>
                      <span className="font-medium">{entry.name ?? entry.email ?? '—'}</span>
                      {entry.referralCode ? <span className="ml-2 text-xs text-muted-foreground">({entry.referralCode})</span> : null}
                    </div>
                    <span className="text-sm font-semibold">{entry.completedCount} referrals</span>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
          <Card>
            <CardHeader title="Recent referrals" />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-card-border text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-3">Referrer</th><th className="pb-2 pr-3">Referred</th><th className="pb-2 pr-3">Code</th><th className="pb-2 pr-3">Status</th><th className="pb-2 pr-3">Date</th>
                </tr></thead>
                <tbody>
                  {referrals.map((ref) => (
                    <tr key={ref.id} className="border-b border-card-border/50">
                      <td className="py-2 pr-3">{ref.referrer.name ?? ref.referrer.email}</td>
                      <td className="py-2 pr-3">{ref.referred.name ?? ref.referred.email}</td>
                      <td className="py-2 pr-3 font-mono text-xs">{ref.code}</td>
                      <td className="py-2 pr-3"><StatusBadge status={ref.status} /></td>
                      <td className="py-2 pr-3 text-xs">{new Date(ref.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : null}

      {tab === 'squads' ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card><Stat label="Total squads" value={squadStats.total} /></Card>
            <Card><Stat label="Active squads" value={squadStats.active} /></Card>
          </div>
          <Card>
            <CardHeader title="All squads" />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-card-border text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-3">Name</th><th className="pb-2 pr-3">Code</th><th className="pb-2 pr-3">Owner</th><th className="pb-2 pr-3">Members</th><th className="pb-2 pr-3">Vouches</th><th className="pb-2 pr-3">Status</th>
                </tr></thead>
                <tbody>
                  {squads.map((s) => (
                    <tr key={s.id} className="border-b border-card-border/50">
                      <td className="py-2 pr-3 font-medium">{s.name}</td>
                      <td className="py-2 pr-3 font-mono text-xs">{s.code}</td>
                      <td className="py-2 pr-3">{s.owner.name ?? s.owner.email}</td>
                      <td className="py-2 pr-3">{s._count.members}</td>
                      <td className="py-2 pr-3">{s._count.vouches}</td>
                      <td className="py-2 pr-3">{s.isActive ? <span className="text-emerald-600">Active</span> : <span className="text-muted-foreground">Disbanded</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : null}

      {tab === 'events' ? (
        <div className="space-y-4">
          <Card>
            <CardHeader title="Create event" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label>Title</Label><Input value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} /></div>
              <div><Label>City</Label><Input value={eventForm.city} onChange={(e) => setEventForm({ ...eventForm, city: e.target.value })} /></div>
              <div><Label>Category</Label><Input value={eventForm.category} onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })} /></div>
              <div><Label>Starts at</Label><Input type="datetime-local" value={eventForm.startsAt} onChange={(e) => setEventForm({ ...eventForm, startsAt: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Description</Label><Input value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} /></div>
            </div>
            <Button className="mt-4" onClick={() => void createEvent()}>Create event</Button>
          </Card>
          <Card>
            <CardHeader title="All events" />
            <div className="space-y-3">
              {events.map((event) => (
                <div key={event.id} className="flex items-center justify-between rounded-lg border border-card-border p-3">
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{event.city} · {event.category} · {new Date(event.startsAt).toLocaleString()} · {event._count.rsvps} RSVPs</p>
                  </div>
                  <Button size="sm" variant="danger" onClick={() => void deleteEvent(event.id)}>Delete</Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : null}

      {tab === 'reports' ? (
        <Card>
          <CardHeader title="Pending reports" />
          <div className="space-y-3">
            {reports.length === 0 ? <p className="text-sm text-muted-foreground">No pending reports</p> : reports.map((report) => (
              <div key={report.id} className="rounded-lg border border-card-border p-4">
                <p className="font-medium">{report.reason}</p>
                {report.details ? <p className="mt-1 text-sm text-muted-foreground">{report.details}</p> : null}
                <p className="mt-2 text-xs text-muted-foreground">
                  {report.reporter.name ?? report.reporter.email} reported {report.reported.name ?? report.reported.email} · {new Date(report.createdAt).toLocaleString()}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => void resolveReport(report.id, 'DISMISS')}>Dismiss</Button>
                  <Button size="sm" variant="outline" onClick={() => void resolveReport(report.id, 'WARN')}>Warn</Button>
                  <Button size="sm" variant="danger" onClick={() => void resolveReport(report.id, 'BAN')}>Ban</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {tab === 'audit' ? (
        <Card>
          <CardHeader title={`Audit Logs (${auditTotal})`} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-card-border text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-3">Time</th><th className="pb-2 pr-3">User</th><th className="pb-2 pr-3">Action</th><th className="pb-2 pr-3">Resource</th><th className="pb-2 pr-3">IP</th>
              </tr></thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} className="border-b border-card-border/50">
                    <td className="py-2 pr-3 text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="py-2 pr-3">{log.user?.name ?? log.user?.email ?? '—'}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{log.action}</td>
                    <td className="py-2 pr-3 text-xs">{log.resource ?? '—'}</td>
                    <td className="py-2 pr-3 text-xs">{log.ip ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-between">
            <Button size="sm" variant="outline" disabled={auditPage <= 1} onClick={() => setAuditPage((p) => p - 1)}>Previous</Button>
            <span className="text-xs text-muted-foreground">Page {auditPage}</span>
            <Button size="sm" variant="outline" onClick={() => setAuditPage((p) => p + 1)}>Next</Button>
          </div>
        </Card>
      ) : null}

      {message ? (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 rounded-xl bg-foreground px-5 py-3 text-sm text-background shadow-lg">
          {message}
        </div>
      ) : null}
    </div>
  );
}

function StatCard({ title, items }: { title: string; items: { label: string; value: string | number }[] }) {
  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold text-muted-foreground">{title}</h3>
      <dl className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex justify-between">
            <dt className="text-sm text-muted-foreground">{item.label}</dt>
            <dd className="text-sm font-semibold">{item.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-2xl font-semibold">{value}</dd>
    </div>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    FREE: 'bg-warm-200/60 text-warm-700 dark:bg-warm-400/20 dark:text-warm-300',
    GOLD: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
    PLATINUM: 'bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300',
  };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[tier] ?? colors['FREE']}`}>{tier}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-800',
    COMPLETED: 'bg-emerald-100 text-emerald-800',
    EXPIRED: 'bg-warm-200/60 text-warm-700',
  };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? ''}`}>{status}</span>;
}
