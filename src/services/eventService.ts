// server/src/services/eventService.ts
// All event and event-registration business logic.

import prisma from "../config/database";
import { AppError } from "../utils/AppError";
import { Role } from "@prisma/client";
import {
  EventListItem,
  EventDetail,
  CreateEventInput,
  UpdateEventInput,
  EventFilters,
  PaginatedResponse,
  CalendarResponse,
  CalendarEvent,
  StudentDashboard,
  ClubListItem,
} from "../types";
import { sendEventCancellationEmail, sendEventRegistrationEmail } from "./emailService";
import { createNotification } from "./notificationService";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getEventOrThrow(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { club: { select: { name: true, logo_url: true } } },
  });
  if (!event) throw new AppError("Event not found", 404, "EVENT_NOT_FOUND");
  return event;
}

// ─── List events with cursor-based pagination and filters ─────────────────────
export async function listEvents(
  filters: EventFilters,
  requestingUser?: { id: string; role: Role }
): Promise<PaginatedResponse<EventListItem>> {
  const {
    club_id,
    type,
    date_from,
    date_to,
    is_free,
    tags,
    skill_areas,
    volunteer_hours_min,
    is_featured,
    search,
    cursor,
    limit = 20,
  } = filters;

  // Non-admins only see published events
  const is_published =
    filters.is_published !== undefined
      ? filters.is_published
      : requestingUser?.role !== "super_admin"
      ? true
      : undefined;

  const where: Record<string, unknown> = {};

  if (club_id) where.club_id = club_id;
  if (type) where.event_type = type;
  if (is_published !== undefined) where.is_published = is_published;
  if (is_free !== undefined) where.is_free = is_free;
  if (is_featured !== undefined) where.is_featured = is_featured;
  if (volunteer_hours_min !== undefined) {
    where.volunteer_hours = { gte: volunteer_hours_min };
  }

  if (date_from || date_to) {
    where.date = {};
    if (date_from) (where.date as Record<string, unknown>).gte = new Date(date_from);
    if (date_to) (where.date as Record<string, unknown>).lte = new Date(date_to);
  }

  if (tags && tags.length > 0) {
    where.tags = { hasSome: tags };
  }

  if (skill_areas && skill_areas.length > 0) {
    where.skill_areas = { hasSome: skill_areas };
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { venue: { contains: search, mode: "insensitive" } },
      { club: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  // Cursor-based pagination
  const cursorClause = cursor
    ? { cursor: { id: cursor } as { id: string }, skip: 1 as number }
    : { cursor: undefined, skip: undefined };

  const events = await prisma.event.findMany({
    where,
    take: limit + 1, // fetch one extra to determine has_more
    orderBy: { date: "asc" },
    cursor: cursorClause.cursor,
    skip: cursorClause.skip,
    include: {
      club: { select: { name: true, logo_url: true } },
    },
  });

  const has_more = events.length > limit;
  const data = has_more ? events.slice(0, limit) : events;
  const next_cursor = has_more ? data[data.length - 1].id : null;

  // Fetch registration status for the requesting user
  let registeredEventIds = new Set<string>();
  if (requestingUser) {
    const registrations = await prisma.eventRegistration.findMany({
      where: {
        user_id: requestingUser.id,
        event_id: { in: data.map((e) => e.id) },
      },
      select: { event_id: true },
    });
    registeredEventIds = new Set(registrations.map((r) => r.event_id));
  }

  return {
    data: data.map((e) => ({
      id: e.id,
      club_id: e.club_id,
      club_name: e.club.name,
      club_logo: e.club.logo_url,
      title: e.title,
      date: e.date,
      end_date: e.end_date,
      venue: e.venue,
      capacity: e.capacity,
      registration_count: e.registration_count,
      event_type: e.event_type,
      is_published: e.is_published,
      is_free: e.is_free,
      points_reward: e.points_reward,
      volunteer_hours: e.volunteer_hours,
      tags: e.tags,
      skill_areas: e.skill_areas,
      is_featured: e.is_featured,
      engagement_score: e.engagement_score,
      banner_url: e.banner_url,
      registration_deadline: e.registration_deadline,
      is_registered: registeredEventIds.has(e.id),
      spots_left: Math.max(0, e.capacity - e.registration_count),
    })),
    meta: { has_more, next_cursor },
  };
}

// ─── Get event detail ─────────────────────────────────────────────────────────
export async function getEventById(
  eventId: string,
  userId?: string
): Promise<EventDetail> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { club: { select: { name: true, logo_url: true } } },
  });

  if (!event) throw new AppError("Event not found", 404, "EVENT_NOT_FOUND");

  let is_registered = false;
  if (userId) {
    const reg = await prisma.eventRegistration.findUnique({
      where: { event_id_user_id: { event_id: eventId, user_id: userId } },
    });
    is_registered = !!reg;
  }

  return {
    id: event.id,
    club_id: event.club_id,
    club_name: event.club.name,
    club_logo: event.club.logo_url,
    title: event.title,
    description: event.description,
    date: event.date,
    end_date: event.end_date,
    venue: event.venue,
    capacity: event.capacity,
    registration_count: event.registration_count,
    event_type: event.event_type,
    is_published: event.is_published,
    is_free: event.is_free,
    points_reward: event.points_reward,
    volunteer_hours: event.volunteer_hours,
    tags: event.tags,
    banner_url: event.banner_url,
    registration_deadline: event.registration_deadline,
    qr_attendance_enabled: event.qr_attendance_enabled,
    pin_attendance_enabled: event.pin_attendance_enabled,
    created_by: event.created_by,
    created_at: event.created_at,
    updated_at: event.updated_at,
    is_registered,
    spots_left: Math.max(0, event.capacity - event.registration_count),
  };
}

// ─── Create event ─────────────────────────────────────────────────────────────
export async function createEvent(
  input: CreateEventInput,
  creatorId: string,
  creatorRole: Role
): Promise<EventDetail> {
  // Only event_manager or super_admin can create events
  if (!["event_manager", "super_admin"].includes(creatorRole)) {
    throw new AppError(
      "Only Event Managers can create events",
      403,
      "FORBIDDEN"
    );
  }

  // Verify club exists and is approved
  const club = await prisma.club.findUnique({ where: { id: input.club_id } });
  if (!club) throw new AppError("Club not found", 404, "CLUB_NOT_FOUND");
  if (club.status !== 'approved')
    throw new AppError("Cannot create events for an unapproved club", 400, "CLUB_NOT_APPROVED");

  // Validate dates
  const eventDate = new Date(input.date);
  if (eventDate < new Date()) {
    throw new AppError("Event date cannot be in the past", 400, "INVALID_DATE");
  }

  if (input.end_date && new Date(input.end_date) <= eventDate) {
    throw new AppError("End date must be after start date", 400, "INVALID_DATE");
  }

  if (input.registration_deadline && new Date(input.registration_deadline) > eventDate) {
    throw new AppError(
      "Registration deadline must be before the event date",
      400,
      "INVALID_DATE"
    );
  }

  const event = await prisma.event.create({
    data: {
      club_id: input.club_id,
      title: input.title,
      description: input.description,
      date: new Date(input.date),
      end_date: input.end_date ? new Date(input.end_date) : null,
      venue: input.venue,
      capacity: input.capacity,
      registration_deadline: input.registration_deadline
        ? new Date(input.registration_deadline)
        : null,
      event_type: input.event_type,
      is_published: input.is_published ?? false,
      points_reward: input.points_reward ?? 0,
      volunteer_hours: input.volunteer_hours ?? 0,
      tags: input.tags ?? [],
      is_free: input.is_free ?? true,
      qr_attendance_enabled: input.qr_attendance_enabled ?? true,
      pin_attendance_enabled: input.pin_attendance_enabled ?? false,
      banner_url: input.banner_url ?? null,
      created_by: creatorId,
    },
    include: { club: { select: { name: true, logo_url: true } } },
  });

  return {
    id: event.id,
    club_id: event.club_id,
    club_name: event.club.name,
    club_logo: event.club.logo_url,
    title: event.title,
    description: event.description,
    date: event.date,
    end_date: event.end_date,
    venue: event.venue,
    capacity: event.capacity,
    registration_count: event.registration_count,
    event_type: event.event_type,
    is_published: event.is_published,
    is_free: event.is_free,
    points_reward: event.points_reward,
    volunteer_hours: event.volunteer_hours,
    tags: event.tags,
    banner_url: event.banner_url,
    registration_deadline: event.registration_deadline,
    qr_attendance_enabled: event.qr_attendance_enabled,
    pin_attendance_enabled: event.pin_attendance_enabled,
    created_by: event.created_by,
    created_at: event.created_at,
    updated_at: event.updated_at,
    is_registered: false,
    spots_left: event.capacity,
  };
}

// ─── Update event ─────────────────────────────────────────────────────────────
export async function updateEvent(
  eventId: string,
  input: UpdateEventInput,
  userId: string,
  userRole: Role
): Promise<EventDetail> {
  const event = await getEventOrThrow(eventId);

  // Ownership: event_manager can only update their own events, super_admin can update any
  if (userRole === "event_manager" && event.created_by !== userId) {
    throw new AppError("You can only update your own events", 403, "FORBIDDEN");
  }

  const updateData: Record<string, unknown> = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.date !== undefined) updateData.date = new Date(input.date as string);
  if (input.end_date !== undefined) updateData.end_date = new Date(input.end_date as string);
  if (input.venue !== undefined) updateData.venue = input.venue;
  if (input.capacity !== undefined) {
    // Cannot reduce below current registration count
    if (input.capacity < event.registration_count) {
      throw new AppError(
        `Capacity cannot be less than current registrations (${event.registration_count})`,
        400,
        "INVALID_CAPACITY"
      );
    }
    updateData.capacity = input.capacity;
  }
  if (input.registration_deadline !== undefined)
    updateData.registration_deadline = new Date(input.registration_deadline as string);
  if (input.event_type !== undefined) updateData.event_type = input.event_type;
  if (input.is_published !== undefined) updateData.is_published = input.is_published;
  if (input.points_reward !== undefined) updateData.points_reward = input.points_reward;
  if (input.volunteer_hours !== undefined) updateData.volunteer_hours = input.volunteer_hours;
  if (input.tags !== undefined) updateData.tags = input.tags;
  if (input.is_free !== undefined) updateData.is_free = input.is_free;
  if (input.qr_attendance_enabled !== undefined)
    updateData.qr_attendance_enabled = input.qr_attendance_enabled;
  if (input.pin_attendance_enabled !== undefined)
    updateData.pin_attendance_enabled = input.pin_attendance_enabled;
  if (input.banner_url !== undefined) updateData.banner_url = input.banner_url;

  // const _updated = await prisma.event.update({
  //   where: { id: eventId },
  //   data: updateData,
  //   include: { club: { select: { name: true, logo_url: true } } },
  // });

  return getEventById(eventId, userId);
}

// ─── Delete event (with cancellation email to registered users) ───────────────
export async function deleteEvent(
  eventId: string,
  userId: string,
  userRole: Role
): Promise<{ message: string }> {
  const event = await getEventOrThrow(eventId);

  if (userRole === "event_manager" && event.created_by !== userId) {
    throw new AppError("You can only delete your own events", 403, "FORBIDDEN");
  }

  // Fetch registered users to notify
  const registrations = await prisma.eventRegistration.findMany({
    where: { event_id: eventId },
    include: { user: { select: { email: true, name: true } } },
  });

  // Delete the event (cascade deletes registrations, qr_codes, attendance_logs)
  await prisma.event.delete({ where: { id: eventId } });

  // Send cancellation emails asynchronously (non-blocking)
  if (registrations.length > 0) {
    const emailPromises = registrations.map((reg) =>
      sendEventCancellationEmail({
        to: reg.user.email,
        userName: reg.user.name,
        eventTitle: event.title,
      }).catch(() => {}) // swallow individual email errors
    );
    // Fire and forget — don't await in request cycle
    Promise.allSettled(emailPromises);
  }

  return { message: "Event deleted successfully" };
}

// ─── Register for an event ────────────────────────────────────────────────────
export async function registerForEvent(
  eventId: string,
  userId: string
): Promise<{ message: string; registration_id: string }> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { club: { select: { name: true } } },
  });
  if (!event) throw new AppError("Event not found", 404, "EVENT_NOT_FOUND");
  if (!event.is_published)
    throw new AppError("This event is not open for registration", 400, "EVENT_NOT_PUBLISHED");

  // Deadline check
  if (event.registration_deadline && new Date() > event.registration_deadline) {
    throw new AppError(
      "Registration deadline has passed",
      400,
      "REGISTRATION_DEADLINE_PASSED"
    );
  }

  // Capacity check
  if (event.registration_count >= event.capacity) {
    throw new AppError("This event is fully booked", 400, "EVENT_FULL");
  }

  // Duplicate check
  const existing = await prisma.eventRegistration.findUnique({
    where: { event_id_user_id: { event_id: eventId, user_id: userId } },
  });
  if (existing)
    throw new AppError("You are already registered for this event", 409, "ALREADY_REGISTERED");

  // Create registration and increment counter atomically
  const [registration] = await prisma.$transaction([
    prisma.eventRegistration.create({
      data: {
        event_id: eventId,
        user_id: userId,
        status: "registered",
      },
    }),
    prisma.event.update({
      where: { id: eventId },
      data: { registration_count: { increment: 1 } },
    }),
  ]);

  // Fetch user details for confirmation email
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  if (user) {
    // Send confirmation email (enqueue to Bull in Phase 1C — for now direct)
    sendEventRegistrationEmail({
      to: user.email,
      userName: user.name,
      eventTitle: event.title,
      eventDate: event.date,
      eventVenue: event.venue,
      clubName: event.club.name,
      eventId: event.id,
    }).catch(() => {}); // fire-and-forget
  }

  // Create in-app notification
  await createNotification({
    userId,
    title: "Registration Confirmed 🎉",
    body: `You're registered for "${event.title}" on ${event.date.toLocaleDateString()}`,
    type: "event_registration",
    metadata: { event_id: eventId },
  }).catch(() => {});

  return {
    message: "Successfully registered for the event",
    registration_id: registration.id,
  };
}

// ─── Unregister from an event ─────────────────────────────────────────────────
export async function unregisterFromEvent(
  eventId: string,
  userId: string
): Promise<{ message: string }> {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new AppError("Event not found", 404, "EVENT_NOT_FOUND");

  const registration = await prisma.eventRegistration.findUnique({
    where: { event_id_user_id: { event_id: eventId, user_id: userId } },
  });

  if (!registration)
    throw new AppError(
      "You are not registered for this event",
      404,
      "NOT_REGISTERED"
    );

  // Cannot unregister if event has already started
  if (new Date() > event.date) {
    throw new AppError(
      "Cannot unregister from an event that has already started",
      400,
      "EVENT_STARTED"
    );
  }

  await prisma.$transaction([
    prisma.eventRegistration.delete({
      where: { event_id_user_id: { event_id: eventId, user_id: userId } },
    }),
    prisma.event.update({
      where: { id: eventId },
      data: { registration_count: { decrement: 1 } },
    }),
  ]);

  return { message: "Successfully unregistered from the event" };
}

// ─── Calendar endpoint ────────────────────────────────────────────────────────
export async function getEventsForCalendar(
  start: string,
  end: string,
  userId: string
): Promise<CalendarResponse> {
  const startDate = new Date(start);
  const endDate = new Date(end);

  const events = await prisma.event.findMany({
    where: {
      is_published: true,
      date: { gte: startDate, lte: endDate },
    },
    orderBy: { date: "asc" },
    include: {
      club: { select: { name: true } },
    },
  });

  // Get user's registered event IDs in this range
  const registrations = await prisma.eventRegistration.findMany({
    where: {
      user_id: userId,
      event_id: { in: events.map((e) => e.id) },
    },
    select: { event_id: true },
  });
  const registeredIds = new Set(registrations.map((r) => r.event_id));

  const calendarEvents: CalendarEvent[] = events.map((e) => ({
    id: e.id,
    title: e.title,
    date: e.date,
    end_date: e.end_date,
    event_type: e.event_type,
    club_name: e.club.name,
    club_id: e.club_id,
    is_registered: registeredIds.has(e.id),
    venue: e.venue,
  }));

  return { start, end, events: calendarEvents };
}

// ─── Student dashboard data ───────────────────────────────────────────────────
export async function getStudentDashboard(userId: string): Promise<StudentDashboard> {
  const [user, userClubs, upcomingRegistrations, stats] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        total_points: true,
        total_volunteer_hours: true,
      },
    }),
    // My clubs
    prisma.userClub.findMany({
      where: { user_id: userId },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: true,
            logo_url: true,
            member_count: true,
            status: true,
            description: true,
          },
        },
      },
    }),
    // My upcoming events (registered, future)
    prisma.eventRegistration.findMany({
      where: {
        user_id: userId,
        event: { date: { gte: new Date() }, is_published: true },
      },
      orderBy: { event: { date: "asc" } },
      take: 5,
      include: {
        event: {
          include: { club: { select: { name: true, logo_url: true } } },
        },
      },
    }),
    // Stats
    prisma.eventRegistration.groupBy({
      by: ["attended"],
      where: { user_id: userId },
      _count: { id: true },
    }),
  ]);

  if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");

  const totalRegistered = stats.reduce((acc, s) => acc + s._count.id, 0);
  const totalAttended = stats.find((s) => s.attended === true)?._count.id ?? 0;

  const upcomingEvents: EventListItem[] = upcomingRegistrations.map((reg) => ({
    id: reg.event.id,
    club_id: reg.event.club_id,
    club_name: reg.event.club.name,
    club_logo: reg.event.club.logo_url,
    title: reg.event.title,
    date: reg.event.date,
    end_date: reg.event.end_date,
    venue: reg.event.venue,
    capacity: reg.event.capacity,
    registration_count: reg.event.registration_count,
    event_type: reg.event.event_type,
    is_published: reg.event.is_published,
    is_free: reg.event.is_free,
    points_reward: reg.event.points_reward,
    volunteer_hours: reg.event.volunteer_hours,
    tags: reg.event.tags,
    banner_url: reg.event.banner_url,
    registration_deadline: reg.event.registration_deadline,
    is_registered: true,
    spots_left: Math.max(0, reg.event.capacity - reg.event.registration_count),
  }));

  return {
    user,
    my_clubs: userClubs.map((uc) => (uc as unknown as { club: ClubListItem }).club),
    upcoming_events: upcomingEvents,
    stats: {
      clubs_joined: userClubs.length,
      events_registered: totalRegistered,
      events_attended: totalAttended,
      total_points: user.total_points,
      total_volunteer_hours: user.total_volunteer_hours,
    },
  };
}
