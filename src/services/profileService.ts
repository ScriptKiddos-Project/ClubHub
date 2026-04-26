// src/services/profileService.ts
// Phase 3 — Achievements, Badges, Points History, Resume export

import { PrismaClient, BadgeType } from '@prisma/client';
import { generateResumePDF } from '../utils/resumeGenerator';
import type { ResumeData } from '../utils/resumeGenerator';

const prisma = new PrismaClient();

// ── Points History ────────────────────────────────────────────────────────────

export async function getPointsHistory(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [history, total] = await Promise.all([
    prisma.pointsHistory.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
      include: {
        user: { select: { total_points: true, total_volunteer_hours: true } },
      },
    }),
    prisma.pointsHistory.count({ where: { user_id: userId } }),
  ]);

  return {
    history: history.map(h => ({
      id: h.id,
      eventId: h.event_id,
      points: h.points,
      hours: h.hours,
      reason: h.reason,
      multiplier: h.multiplier,
      createdAt: h.created_at,
    })),
    meta: {
      total,
      page,
      limit,
      has_more: skip + history.length < total,
    },
  };
}

// ── Full Achievements ─────────────────────────────────────────────────────────

export async function getAchievements(userId: string) {
  const [user, clubs, events, badges, certificates] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        total_points: true,
        total_volunteer_hours: true,
        enrollment_year: true,
        degree_type: true,
      },
    }),
    prisma.userClub.findMany({
      where: { user_id: userId },
      include: { club: { select: { name: true, category: true } } },
      orderBy: { joined_at: 'desc' },
    }),
    prisma.eventRegistration.findMany({
      where: { user_id: userId, attended: true },
      include: {
        event: {
          select: {
            title: true,
            date: true,
            points_reward: true,
            volunteer_hours: true,
            club: { select: { name: true } },
          },
        },
      },
      orderBy: { registered_at: 'desc' },
    }),
    prisma.badge.findMany({
      where: { user_id: userId },
      orderBy: { awarded_at: 'desc' },
    }),
    prisma.certificate.findMany({
      where: { user_id: userId },
      orderBy: { issued_at: 'desc' },
    }),
  ]);

  return {
    profile: {
      id: user.id,
      name: user.name,
      email: user.email,
      department: user.department,
      enrollmentYear: user.enrollment_year,
      degreeType: user.degree_type,
      totalPoints: user.total_points,
      totalVolunteerHours: user.total_volunteer_hours,
    },
    clubs: clubs.map(uc => ({
      clubId: uc.club_id,
      name: uc.club.name,
      category: uc.club.category,
      role: uc.role,
      joinedAt: uc.joined_at,
    })),
    eventsAttended: events.map(reg => ({
      eventId: reg.event_id,
      title: reg.event.title,
      clubName: reg.event.club.name,
      date: reg.event.date,
      pointsAwarded: reg.points_awarded,
      hoursAwarded: reg.hours_awarded,
      status: reg.status,
    })),
    badges: badges.map(b => ({
      id: b.id,
      badgeType: b.badge_type,
      awardedAt: b.awarded_at,
      eventId: b.event_id,
    })),
    certificates: certificates.map(c => ({
      id: c.id,
      eventId: c.event_id,
      clubId: c.club_id,
      pdfUrl: c.pdf_url,
      issuedAt: c.issued_at,
      pointsAwarded: c.points_awarded,
      hoursAwarded: c.hours_awarded,
      multiplierUsed: c.multiplier_used,
    })),
    summary: {
      clubsJoined: clubs.length,
      eventsAttended: events.length,
      badgesEarned: badges.length,
      certificatesIssued: certificates.length,
    },
  };
}

// ── Resume PDF Export ─────────────────────────────────────────────────────────

export async function exportResumePDF(userId: string): Promise<Buffer> {
  const achievements = await getAchievements(userId);

  const data: ResumeData = {
    name: achievements.profile.name,
    email: achievements.profile.email,
    department: achievements.profile.department,
    enrollmentYear: achievements.profile.enrollmentYear,
    degreeType: achievements.profile.degreeType,
    totalPoints: achievements.profile.totalPoints,
    totalVolunteerHours: achievements.profile.totalVolunteerHours,
    clubs: achievements.clubs.map(c => ({
      name: c.name,
      category: c.category,
      role: c.role,
      joinedAt: c.joinedAt,
    })),
    events: achievements.eventsAttended.map(e => ({
      title: e.title,
      clubName: e.clubName,
      date: e.date,
      pointsAwarded: e.pointsAwarded ?? 0,
      hoursAwarded: e.hoursAwarded ?? 0,
      status: e.status,
    })),
    badges: achievements.badges.map(b => ({
      badgeType: b.badgeType,
      awardedAt: b.awardedAt,
    })),
    certificates: achievements.certificates.map(c => ({
      eventTitle: c.eventId, // will be populated in join below
      clubName: c.clubId,
      eventDate: c.issuedAt,
      pointsAwarded: c.pointsAwarded,
    })),
  };

  return generateResumePDF(data);
}

// ── Badge Award Logic ─────────────────────────────────────────────────────────

/**
 * Called after any attendance is confirmed. Checks all badge conditions for
 * the user and awards any newly unlocked badges.
 */
export async function checkAndAwardBadges(userId: string, eventId?: string) {
  const [attendedCount, user, existingBadges] = await Promise.all([
    prisma.eventRegistration.count({ where: { user_id: userId, attended: true } }),
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { role: true } }),
    prisma.badge.findMany({ where: { user_id: userId }, select: { badge_type: true } }),
  ]);

  const alreadyHas = new Set(existingBadges.map(b => b.badge_type));
  const toAward: BadgeType[] = [];

  if (attendedCount >= 1  && !alreadyHas.has(BadgeType.first_event))       toAward.push(BadgeType.first_event);
  if (attendedCount >= 10 && !alreadyHas.has(BadgeType.ten_events))        toAward.push(BadgeType.ten_events);
  if (attendedCount >= 25 && !alreadyHas.has(BadgeType.twenty_five_events)) toAward.push(BadgeType.twenty_five_events);

  if ((user.role === 'club_admin') && !alreadyHas.has(BadgeType.core_member)) {
    toAward.push(BadgeType.core_member);
  }

  // Volunteer star: 10+ hours
  const userRecord = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { total_volunteer_hours: true },
  });
  if (userRecord.total_volunteer_hours >= 10 && !alreadyHas.has(BadgeType.volunteer_star)) {
    toAward.push(BadgeType.volunteer_star);
  }

  // 3-event streak (3 consecutive registered events attended)
  if (!alreadyHas.has(BadgeType.streak_3)) {
    const recentRegistrations = await prisma.eventRegistration.findMany({
      where: { user_id: userId },
      orderBy: { registered_at: 'desc' },
      take: 3,
      select: { attended: true },
    });
    const hasStreak = recentRegistrations.length >= 3 && recentRegistrations.every(r => r.attended);
    if (hasStreak) toAward.push(BadgeType.streak_3);
  }

  if (toAward.length > 0) {
    await prisma.badge.createMany({
      data: toAward.map(badge_type => ({
        user_id: userId,
        badge_type,
        event_id: eventId ?? null,
      })),
      skipDuplicates: true,
    });
  }

  return toAward;
}
