'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiFetch } from '@/lib/api/client';

type Event = {
  id: string;
  title: string;
  description: string | null;
  city: string;
  category: string;
  startsAt: string;
  maxAttendees: number | null;
  _count: { rsvps: number };
};

export function EventsBoard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [rsvping, setRsvping] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ events: Event[] }>('/api/events').then((r) => {
      setLoading(false);
      if (r.success) setEvents(r.data.events);
    });
  }, []);

  async function rsvp(eventId: string) {
    setRsvping(eventId);
    await apiFetch('/api/events', { method: 'POST', body: JSON.stringify({ eventId }) });
    setRsvping(null);
    const r = await apiFetch<{ events: Event[] }>('/api/events');
    if (r.success) setEvents(r.data.events);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="text-muted-foreground">No upcoming events — check back soon!</p>
        </Card>
      ) : (
        events.map((event) => (
          <Card key={event.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {event.category}
                </span>
                <h3 className="mt-2 font-[family-name:var(--font-playfair)] text-lg font-semibold">
                  {event.title}
                </h3>
                {event.description ? (
                  <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
                ) : null}
                <p className="mt-2 text-xs text-muted-foreground">
                  {event.city} · {new Date(event.startsAt).toLocaleString()} · {event._count.rsvps}{' '}
                  going
                </p>
              </div>
              <Button size="sm" loading={rsvping === event.id} onClick={() => void rsvp(event.id)}>
                RSVP
              </Button>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
