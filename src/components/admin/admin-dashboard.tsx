'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api/client';

type Tab = 'overview' | 'events' | 'reports';

type Stats = {
  userCount: number;
  matchCount: number;
  reportCount: number;
  swipeCount: number;
  auditCount: number;
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

export function AdminDashboard({ initialStats }: { initialStats: Stats }) {
  const [tab, setTab] = useState<Tab>('overview');
  const [stats] = useState(initialStats);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [message, setMessage] = useState('');
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    city: 'Dubai',
    country: 'AE',
    category: 'Social',
    startsAt: '',
    maxAttendees: '',
  });

  useEffect(() => {
    if (tab === 'events') {
      apiFetch<{ events: EventRow[] }>('/api/admin/events').then((r) => {
        if (r.success) setEvents(r.data.events);
      });
    }
    if (tab === 'reports') {
      apiFetch<{ reports: ReportRow[] }>('/api/admin/reports').then((r) => {
        if (r.success) setReports(r.data.reports);
      });
    }
  }, [tab]);

  async function createEvent() {
    const result = await apiFetch('/api/admin/events', {
      method: 'POST',
      body: JSON.stringify({
        title: eventForm.title,
        description: eventForm.description || undefined,
        city: eventForm.city,
        country: eventForm.country,
        category: eventForm.category,
        startsAt: new Date(eventForm.startsAt).toISOString(),
        maxAttendees: eventForm.maxAttendees ? Number(eventForm.maxAttendees) : undefined,
      }),
    });
    if (result.success) {
      setMessage('Event created');
      setEventForm({ ...eventForm, title: '', description: '', startsAt: '' });
      const refreshed = await apiFetch<{ events: EventRow[] }>('/api/admin/events');
      if (refreshed.success) setEvents(refreshed.data.events);
    }
  }

  async function deleteEvent(id: string) {
    if (!confirm('Delete this event?')) return;
    await apiFetch(`/api/admin/events/${id}`, { method: 'DELETE' });
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  async function resolveReport(id: string, action: 'DISMISS' | 'WARN' | 'BAN') {
    await apiFetch(`/api/admin/reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action }),
    });
    setReports((prev) => prev.filter((r) => r.id !== id));
    setMessage(`Report ${action.toLowerCase()}ed`);
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'events', label: 'Events' },
    { id: 'reports', label: 'Reports' },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card>
        <CardHeader title="Admin Dashboard" description="Mayla platform management" />
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <Button
              key={t.id}
              size="sm"
              variant={tab === t.id ? 'primary' : 'outline'}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </Button>
          ))}
        </div>
      </Card>

      {tab === 'overview' ? (
        <Card>
          <dl className="grid gap-4 sm:grid-cols-3">
            <Stat label="Users" value={stats.userCount} />
            <Stat label="Matches" value={stats.matchCount} />
            <Stat label="Pending reports" value={stats.reportCount} />
            <Stat label="Swipes" value={stats.swipeCount} />
            <Stat label="Audit logs" value={stats.auditCount} />
          </dl>
        </Card>
      ) : null}

      {tab === 'events' ? (
        <div className="space-y-4">
          <Card>
            <CardHeader title="Create event" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Title</Label>
                <Input value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} />
              </div>
              <div>
                <Label>City</Label>
                <Input value={eventForm.city} onChange={(e) => setEventForm({ ...eventForm, city: e.target.value })} />
              </div>
              <div>
                <Label>Category</Label>
                <Input value={eventForm.category} onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })} />
              </div>
              <div>
                <Label>Starts at</Label>
                <Input type="datetime-local" value={eventForm.startsAt} onChange={(e) => setEventForm({ ...eventForm, startsAt: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label>Description</Label>
                <Input value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} />
              </div>
            </div>
            <Button className="mt-4" onClick={() => void createEvent()}>
              Create event
            </Button>
          </Card>

          <Card>
            <CardHeader title="All events" />
            <div className="space-y-3">
              {events.map((event) => (
                <div key={event.id} className="flex items-center justify-between rounded-lg border border-card-border p-3">
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.city} · {event.category} · {new Date(event.startsAt).toLocaleString()} · {event._count.rsvps} RSVPs
                    </p>
                  </div>
                  <Button size="sm" variant="danger" onClick={() => void deleteEvent(event.id)}>
                    Delete
                  </Button>
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
            {reports.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending reports</p>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="rounded-lg border border-card-border p-4">
                  <p className="font-medium">{report.reason}</p>
                  {report.details ? <p className="mt-1 text-sm text-muted-foreground">{report.details}</p> : null}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {report.reporter.name ?? report.reporter.email} reported {report.reported.name ?? report.reported.email}
                    {' · '}
                    {new Date(report.createdAt).toLocaleString()}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => void resolveReport(report.id, 'DISMISS')}>
                      Dismiss
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => void resolveReport(report.id, 'WARN')}>
                      Warn
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => void resolveReport(report.id, 'BAN')}>
                      Ban
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      ) : null}

      {message ? (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 rounded-xl bg-foreground px-5 py-3 text-sm text-background">
          {message}
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-card-border p-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-2xl font-semibold">{value}</dd>
    </div>
  );
}
