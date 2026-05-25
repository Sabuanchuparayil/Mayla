import { db } from '@/lib/db';
import { AppError, ErrorCodes } from '@/lib/api/errors';

export async function listUpcomingEvents(city?: string) {
  return db.communityEvent.findMany({
    where: {
      startsAt: { gte: new Date() },
      ...(city ? { city: { contains: city, mode: 'insensitive' } } : {}),
    },
    include: {
      _count: { select: { rsvps: true } },
    },
    orderBy: { startsAt: 'asc' },
    take: 30,
  });
}

export async function rsvpToEvent(userId: string, eventId: string, status: 'GOING' | 'INTERESTED' = 'GOING') {
  const event = await db.communityEvent.findUnique({
    where: { id: eventId },
    include: { _count: { select: { rsvps: true } } },
  });
  if (!event) throw new AppError(ErrorCodes.NOT_FOUND, 'Event not found', 404);
  if (event.maxAttendees && event._count.rsvps >= event.maxAttendees) {
    throw new AppError(ErrorCodes.CONFLICT, 'Event is full', 409);
  }

  return db.eventRsvp.upsert({
    where: { eventId_userId: { eventId, userId } },
    create: { eventId, userId, status },
    update: { status },
  });
}

export async function listEventAttendees(eventId: string, viewerId: string) {
  const rsvps = await db.eventRsvp.findMany({
    where: { eventId, status: 'GOING' },
    include: {
      user: {
        select: {
          id: true,
          verified: true,
          profile: { select: { displayName: true, photos: true, city: true } },
        },
      },
    },
    take: 50,
  });
  return rsvps.filter((r) => r.userId !== viewerId);
}

export async function listAllEvents() {
  return db.communityEvent.findMany({
    include: { _count: { select: { rsvps: true } } },
    orderBy: { startsAt: 'desc' },
    take: 100,
  });
}

export async function createCommunityEvent(data: {
  title: string;
  description?: string;
  city: string;
  country?: string;
  category: string;
  startsAt: Date;
  maxAttendees?: number;
}) {
  return db.communityEvent.create({ data });
}

export async function updateCommunityEvent(
  eventId: string,
  data: Partial<{
    title: string;
    description: string | null;
    city: string;
    country: string;
    category: string;
    startsAt: Date;
    maxAttendees: number | null;
  }>,
) {
  const event = await db.communityEvent.findUnique({ where: { id: eventId } });
  if (!event) throw new AppError(ErrorCodes.NOT_FOUND, 'Event not found', 404);
  return db.communityEvent.update({ where: { id: eventId }, data });
}

export async function deleteCommunityEvent(eventId: string) {
  const event = await db.communityEvent.findUnique({ where: { id: eventId } });
  if (!event) throw new AppError(ErrorCodes.NOT_FOUND, 'Event not found', 404);
  await db.communityEvent.delete({ where: { id: eventId } });
}
