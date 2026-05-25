import { db } from '@/lib/db';

export const AVAILABILITY_DAYS = [
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
] as const;

export const AVAILABILITY_TIMES = [
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
  { value: 'night', label: 'Night' },
] as const;

const AVAILABILITY_TTL_MS = 48 * 60 * 60 * 1000;

export function availabilityLabel(day: string | null, time: string | null): string | null {
  if (!day || !time) return null;
  const dayLabel = AVAILABILITY_DAYS.find((d) => d.value === day)?.label ?? day;
  const timeLabel = AVAILABILITY_TIMES.find((t) => t.value === time)?.label ?? time;
  return `Free ${dayLabel} ${timeLabel}`;
}

export function computeAvailabilityExpiry(): Date {
  return new Date(Date.now() + AVAILABILITY_TTL_MS);
}

export function isAvailabilityActive(expiry: Date | null | undefined): boolean {
  if (!expiry) return false;
  return expiry > new Date();
}

export async function clearExpiredAvailability(): Promise<void> {
  await db.profile.updateMany({
    where: {
      availableExpiry: { lt: new Date() },
      OR: [{ availableDay: { not: null } }, { availableTime: { not: null } }],
    },
    data: {
      availableDay: null,
      availableTime: null,
      availableExpiry: null,
    },
  });
}

export type AvailabilityState = {
  availableDay: string | null;
  availableTime: string | null;
  availableExpiry: string | null;
  active: boolean;
  label: string | null;
};

export function toAvailabilityState(profile: {
  availableDay: string | null;
  availableTime: string | null;
  availableExpiry: Date | null;
}): AvailabilityState {
  const active = isAvailabilityActive(profile.availableExpiry);
  return {
    availableDay: active ? profile.availableDay : null,
    availableTime: active ? profile.availableTime : null,
    availableExpiry: active && profile.availableExpiry ? profile.availableExpiry.toISOString() : null,
    active,
    label: active ? availabilityLabel(profile.availableDay, profile.availableTime) : null,
  };
}
