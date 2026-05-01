// server/src/services/adminService.ts
// Super Admin broadcast announcements — platform-wide or club-scoped.

import prisma from "../config/database";
import { AppError } from "../utils/AppError";
import { NotificationType } from "@prisma/client";

export interface AnnouncementInput {
  title:    string;
  body:     string;
  club_id?: string; // omit → broadcast to ALL verified users
}

export interface AnnouncementListItem {
  id:         string;
  title:      string;
  body:       string;
  club_id:    string | null;
  club_name:  string | null;
  sent_to:    number;
  created_at: Date;
}

// ─── Broadcast announcement ───────────────────────────────────────────────────
export async function broadcastAnnouncement(
  input:   AnnouncementInput,
  adminId: string
): Promise<{ id: string; sent_to: number }> {
  const { title, body, club_id } = input;

  if (!title?.trim() || !body?.trim()) {
    throw new AppError("Title and body are required", 400, "VALIDATION_ERROR");
  }

  // Determine target user IDs
  let userIds: string[];

  if (club_id) {
    const club = await prisma.club.findUnique({ where: { id: club_id } });
    if (!club) throw new AppError("Club not found", 404, "CLUB_NOT_FOUND");

    const memberships = await prisma.userClub.findMany({
      where:  { club_id },
      select: { user_id: true },
    });
    userIds = memberships.map((m) => m.user_id);
  } else {
    const users = await prisma.user.findMany({
      where:  { is_verified: true },
      select: { id: true },
    });
    userIds = users.map((u) => u.id);
  }

  if (userIds.length === 0) {
    throw new AppError("No recipients found", 400, "NO_RECIPIENTS");
  }

  // Use club_announcement for club-scoped, system for platform-wide
  const notifType: NotificationType = club_id
    ? NotificationType.club_announcement
    : NotificationType.system;

  await prisma.notification.createMany({
    data: userIds.map((uid) => ({
      user_id: uid,
      title,
      body,
      type:    notifType,
      is_read: false,
    })),
    skipDuplicates: true,
  });

  // Log the broadcast
  const log = await prisma.auditLog.create({
    data: {
      action:      "ANNOUNCEMENT_BROADCAST",
      actor_id:    adminId,
      target_type: "platform",
      target_id:   club_id ?? "all",
      club_id:     club_id ?? null,
      metadata:    { title, body, sent_to: userIds.length, club_id: club_id ?? null },
    },
  });

  return { id: log.id, sent_to: userIds.length };
}

// ─── List past broadcasts ─────────────────────────────────────────────────────
export async function listAnnouncements(): Promise<AnnouncementListItem[]> {
  const logs = await prisma.auditLog.findMany({
    where:   { action: "ANNOUNCEMENT_BROADCAST" },
    orderBy: { created_at: "desc" },
    take:    50,
    include: { club: true },
  });

  return logs.map((l) => {
    const meta = (l.metadata ?? {}) as Record<string, unknown>;
    return {
      id:         l.id,
      title:      String(meta.title   ?? ""),
      body:       String(meta.body    ?? ""),
      club_id:    l.club_id  ?? null,
      club_name:  l.club?.name ?? null,
      sent_to:    Number(meta.sent_to ?? 0),
      created_at: l.created_at,
    };
  });
}