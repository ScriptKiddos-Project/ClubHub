// server/src/services/clubService.ts
// All club-related business logic. No DB queries in controllers.

import prisma from "../config/database";
import { AppError } from "../utils/AppError";
import {
  ClubMemberRole,
  ClubStatus,
} from "@prisma/client";
import {
  ClubListItem,
  ClubDetail,
  CreateClubInput,
  ClubFilters,
  PaginatedResponse,
} from "../types";

// ─── List approved clubs with pagination ──────────────────────────────────────
export async function listClubs(
  filters: ClubFilters,
  userId?: string
): Promise<PaginatedResponse<ClubListItem>> {
  const { page = 1, limit = 20, category, search } = filters;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { status: ClubStatus.approved };

  if (category) where.category = category;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [clubs, total] = await Promise.all([
    prisma.club.findMany({
      where,
      skip,
      take: limit,
      orderBy: { member_count: "desc" },
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
    }),
    prisma.club.count({ where }),
  ]);

  const memberships = userId
    ? await prisma.userClub.findMany({
        where: {
          user_id: userId,
          club_id: { in: clubs.map((club) => club.id) },
        },
        select: { club_id: true },
      })
    : [];
  const joinedClubIds = new Set(memberships.map((membership) => membership.club_id));

  return {
    data: clubs.map((club) => ({
      ...club,
      is_member: joinedClubIds.has(club.id),
    })),
    meta: {
      total,
      page,
      limit,
      has_more: skip + clubs.length < total,
    },
  };
}

// ─── List ALL clubs regardless of status (Super Admin only) ──────────────────
export async function listAllClubs(
  filters: ClubFilters
): Promise<PaginatedResponse<ClubListItem>> {
  const { page = 1, limit = 20, category, search } = filters;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [clubs, total] = await Promise.all([
    prisma.club.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
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
    }),
    prisma.club.count({ where }),
  ]);

  return {
    data: clubs,
    meta: { total, page, limit, has_more: skip + clubs.length < total },
  };
}

// ─── Get club detail by ID ────────────────────────────────────────────────────
export async function getClubById(
  clubId: string,
  userId?: string
): Promise<ClubDetail> {
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    include: {
      events: {
        where: {
          is_published: true,
          date: { gte: new Date() },
        },
        orderBy: { date: "asc" },
        take: 5,
        select: {
          id: true,
          club_id: true,
          title: true,
          date: true,
          end_date: true,
          venue: true,
          capacity: true,
          registration_count: true,
          event_type: true,
          is_published: true,
          is_free: true,
          points_reward: true,
          volunteer_hours: true,
          tags: true,
          banner_url: true,
          registration_deadline: true,
        },
      },
    },
  });

  if (!club) throw new AppError("Club not found", 404, "CLUB_NOT_FOUND");

  let is_member = false;
  let user_role: ClubMemberRole | null = null;

  if (userId) {
    const membership = await prisma.userClub.findUnique({
      where: { user_id_club_id: { user_id: userId, club_id: clubId } },
    });
    is_member = !!membership;
    user_role = membership?.role ?? null;
  }

  return {
    ...club,
    status: club.status,
    upcoming_events: club.events.map((e) => ({
      ...e,
      club_name: club.name,
      club_logo: club.logo_url,
      is_registered: false,
      spots_left: e.capacity - e.registration_count,
    })),
    is_member,
    user_role,
  };
}

// ─── Create club (status = pending, Super Admin must approve) ─────────────────
export async function createClub(
  input: CreateClubInput,
  creatorId: string
): Promise<{ id: string; name: string; slug: string; status: ClubStatus }> {
  const existing = await prisma.club.findFirst({
    where: { OR: [{ name: input.name }, { slug: input.slug }] },
  });

  if (existing) {
    const field = existing.name === input.name ? "name" : "slug";
    throw new AppError(
      `A club with this ${field} already exists`,
      409,
      "CLUB_DUPLICATE"
    );
  }

  const club = await prisma.club.create({
    data: {
      ...input,
      created_by: creatorId,
      status: ClubStatus.pending,
    },
    select: { id: true, name: true, slug: true, status: true },
  });

  await prisma.auditLog.create({
    data: {
      action: "CLUB_CREATED",
      actor_id: creatorId,
      target_type: "club",
      target_id: club.id,
      metadata: { name: club.name },
    },
  });

  return club;
}

// ─── Update any club's details (Super Admin only) ─────────────────────────────
export async function updateClub(
  clubId: string,
  input: Partial<CreateClubInput>,
  adminId: string
): Promise<ClubListItem> {
  const club = await prisma.club.findUnique({ where: { id: clubId } });
  if (!club) throw new AppError("Club not found", 404, "CLUB_NOT_FOUND");

  // If name or slug is changing, check uniqueness
  if (input.name && input.name !== club.name) {
    const nameConflict = await prisma.club.findFirst({
      where: { name: input.name, id: { not: clubId } },
    });
    if (nameConflict) throw new AppError("A club with this name already exists", 409, "CLUB_DUPLICATE");
  }
  if (input.slug && input.slug !== club.slug) {
    const slugConflict = await prisma.club.findFirst({
      where: { slug: input.slug, id: { not: clubId } },
    });
    if (slugConflict) throw new AppError("A club with this slug already exists", 409, "CLUB_DUPLICATE");
  }

  const updated = await prisma.club.update({
    where: { id: clubId },
    data: input,
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
  });

  await prisma.auditLog.create({
    data: {
      action: "CLUB_UPDATED",
      actor_id: adminId,
      target_type: "club",
      target_id: clubId,
      metadata: { changes: input },
    },
  });

  return updated;
}

// ─── List pending clubs (Super Admin only) ────────────────────────────────────
export async function listPendingClubs(): Promise<ClubListItem[]> {
  return prisma.club.findMany({
    where: { status: ClubStatus.pending },
    orderBy: { created_at: "asc" },
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
  });
}

// ─── Approve or reject a club ─────────────────────────────────────────────────
export async function approveOrRejectClub(
  clubId: string,
  approved: boolean,
  reason: string | undefined,
  adminId: string
): Promise<{ id: string; status: ClubStatus; rejection_reason: string | null }> {
  const club = await prisma.club.findUnique({ where: { id: clubId } });
  if (!club) throw new AppError("Club not found", 404, "CLUB_NOT_FOUND");

  if (club.status === ClubStatus.approved) {
    throw new AppError("Club is already approved", 409, "CLUB_ALREADY_APPROVED");
  }

  const updated = await prisma.club.update({
    where: { id: clubId },
    data: {
      status: approved ? ClubStatus.approved : ClubStatus.rejected,
      rejection_reason: approved ? null : (reason ?? "No reason given"),
      approved_by: approved ? adminId : null,
      approved_at: approved ? new Date() : null,
    },
    select: { id: true, status: true, rejection_reason: true },
  });

  await prisma.auditLog.create({
    data: {
      action: approved ? "CLUB_APPROVED" : "CLUB_REJECTED",
      actor_id: adminId,
      target_type: "club",
      target_id: clubId,
      club_id: clubId,
      metadata: { reason },
    },
  });

  return updated;
}

// ─── Join a club ──────────────────────────────────────────────────────────────
export async function joinClub(
  clubId: string,
  userId: string
): Promise<{ message: string }> {
  const club = await prisma.club.findUnique({ where: { id: clubId } });
  if (!club) throw new AppError("Club not found", 404, "CLUB_NOT_FOUND");
  if (club.status !== ClubStatus.approved)
    throw new AppError("This club is not yet approved", 400, "CLUB_NOT_APPROVED");

  const existing = await prisma.userClub.findUnique({
    where: { user_id_club_id: { user_id: userId, club_id: clubId } },
  });
  if (existing)
    throw new AppError("You are already a member of this club", 409, "ALREADY_MEMBER");

  await prisma.$transaction([
    prisma.userClub.create({
      data: { user_id: userId, club_id: clubId, role: "member" },
    }),
    prisma.club.update({
      where: { id: clubId },
      data: { member_count: { increment: 1 } },
    }),
  ]);

  return { message: "Successfully joined the club" };
}

// ─── Leave a club ─────────────────────────────────────────────────────────────
export async function leaveClub(
  clubId: string,
  userId: string
): Promise<{ message: string }> {
  const membership = await prisma.userClub.findUnique({
    where: { user_id_club_id: { user_id: userId, club_id: clubId } },
  });

  if (!membership)
    throw new AppError("You are not a member of this club", 404, "NOT_MEMBER");

  await prisma.$transaction([
    prisma.userClub.delete({
      where: { user_id_club_id: { user_id: userId, club_id: clubId } },
    }),
    prisma.club.update({
      where: { id: clubId },
      data: { member_count: { decrement: 1 } },
    }),
  ]);

  return { message: "Successfully left the club" };
}