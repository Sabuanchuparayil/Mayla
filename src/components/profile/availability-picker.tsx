'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { SingleSelectChips } from '@/components/ui/chip-select';
import { apiFetch } from '@/lib/api/client';
import { AVAILABILITY_DAYS, AVAILABILITY_TIMES } from '@/lib/availability';

type AvailabilityState = {
  availableDay: string | null;
  availableTime: string | null;
  active: boolean;
  label: string | null;
};

export function AvailabilityPicker() {
  const [state, setState] = useState<AvailabilityState>({
    availableDay: null,
    availableTime: null,
    active: false,
    label: null,
  });
  const [day, setDay] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch<{ availability: AvailabilityState }>('/api/users/me/availability').then((r) => {
      setLoading(false);
      if (r.success) {
        setState(r.data.availability);
        setDay(r.data.availability.availableDay);
        setTime(r.data.availability.availableTime);
      }
    });
  }, []);

  async function save(nextDay: string | null, nextTime: string | null) {
    setSaving(true);
    const result = await apiFetch<{ availability: AvailabilityState }>('/api/users/me/availability', {
      method: 'PATCH',
      body: JSON.stringify({ availableDay: nextDay, availableTime: nextTime }),
    });
    setSaving(false);
    if (result.success) {
      setState(result.data.availability);
      setDay(result.data.availability.availableDay);
      setTime(result.data.availability.availableTime);
    }
  }

  async function clear() {
    await save(null, null);
  }

  if (loading) {
    return <div className="h-20 animate-pulse rounded-xl bg-warm-200/50 dark:bg-warm-400/10" />;
  }

  return (
    <div className="space-y-4 rounded-xl border border-primary/10 bg-primary/5 p-4">
      <div>
        <h3 className="text-sm font-semibold text-primary">Available for Outing</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Let Gold+ members know when you&apos;re free. Expires automatically after 48 hours.
        </p>
        {state.active && state.label ? (
          <p className="mt-2 text-sm font-medium text-emerald-600">{state.label}</p>
        ) : null}
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Day</p>
        <SingleSelectChips
          options={AVAILABILITY_DAYS.map((d) => ({ value: d.value, label: d.label }))}
          value={day}
          onChange={(v) => {
            setDay(v);
            if (time) void save(v, time);
          }}
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Time</p>
        <SingleSelectChips
          options={AVAILABILITY_TIMES.map((t) => ({ value: t.value, label: t.label }))}
          value={time}
          onChange={(v) => {
            setTime(v);
            if (day) void save(day, v);
          }}
        />
      </div>

      <div className="flex gap-2">
        {state.active ? (
          <Button type="button" variant="outline" size="sm" loading={saving} onClick={clear}>
            Clear availability
          </Button>
        ) : null}
      </div>
    </div>
  );
}
