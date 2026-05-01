// services/phase3Service.ts
// All raw API calls for Phase 3 features.
// Import `api` from the existing Axios instance.

import api from './api';
import type {
  GeoAttendancePayload,
  GeoAttendanceResult,
  PointsHistoryResponse,
  AchievementsResponse,
  EarnedBadge,
  LockedBadge,
  Certificate,
  CertificatesResponse,
  ResumeExportResponse,
  AttendanceMethodConfig,
  EventVenueCoords,
} from '../types/phase3';

// ─── GEO-FENCE ATTENDANCE ────────────────────────────────────────────────────

/** Submit student GPS coords; server runs Haversine check */
export const submitGeoAttendance = async (
  eventId: string,
  payload: GeoAttendancePayload
): Promise<GeoAttendanceResult> => {
  const { data } = await api.post<{ success: true; data: GeoAttendanceResult }>(
    `/events/${eventId}/geo-attendance`,
    payload
  );
  return data.data;
};

/** Fetch venue GPS + configured fence radius for a given event */
export const fetchEventVenueCoords = async (eventId: string): Promise<EventVenueCoords> => {
  const { data } = await api.get<{ success: true; data: EventVenueCoords }>(
    `/events/${eventId}/venue-coords`
  );
  return data.data;
};

// ─── POINTS HISTORY ──────────────────────────────────────────────────────────

export const fetchPointsHistory = async (
  page = 1,
  limit = 20
): Promise<PointsHistoryResponse> => {
  const { data } = await api.get<{ success: true; data: PointsHistoryResponse }>(
    `/users/me/points-history`,
    { params: { page, limit } }
  );
  return data.data;
};

// ─── ACHIEVEMENTS ─────────────────────────────────────────────────────────────
//
// The backend returns a flat object shaped as:
//   { profile, clubs, eventsAttended, badges, certificates, summary }
//
// ProfilePagePhase3 expects AchievementsResponse:
//   { totalPoints, totalHours, earnedBadges, lockedBadges, certificates }
//
// We normalise here so nothing else in the codebase needs to change.

// Badge metadata keyed by the Prisma BadgeType enum values
const BADGE_META: Record<string, {
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  unlockCondition: string;
}> = {
  first_event:        { name: 'First Step',       description: 'Attended your first event',        icon: '🎉', tier: 'bronze',   unlockCondition: 'Attend 1 event' },
  ten_events:         { name: 'Event Enthusiast',  description: 'Attended 10 events',               icon: '🔟', tier: 'silver',   unlockCondition: 'Attend 10 events' },
  twenty_five_events: { name: 'Super Attendee',    description: 'Attended 25 events',               icon: '🏆', tier: 'gold',     unlockCondition: 'Attend 25 events' },
  core_member:        { name: 'Core Member',       description: 'Joined a club as a core member',   icon: '⭐', tier: 'gold',     unlockCondition: 'Become a core member' },
  volunteer_star:     { name: 'Volunteer Star',    description: 'Accumulated 10+ volunteer hours',  icon: '💫', tier: 'silver',   unlockCondition: 'Earn 10 volunteer hours' },
  event_organiser:    { name: 'Event Organiser',   description: 'Organised 5 or more events',       icon: '🎯', tier: 'platinum', unlockCondition: 'Organise 5 events' },
  streak_3:           { name: 'On a Roll',         description: '3 consecutive events attended',    icon: '🔥', tier: 'bronze',   unlockCondition: 'Attend 3 events in a row' },
};

// All possible badge types — used to derive locked badges
const ALL_BADGE_TYPES = Object.keys(BADGE_META);

// Raw shape returned by GET /api/v1/users/me/achievements
interface BackendAchievements {
  profile: {
    totalPoints: number;
    totalVolunteerHours: number;
  };
  badges: Array<{
    id: string;
    badgeType: string;
    awardedAt: string;
    eventId?: string | null;
  }>;
  certificates: Array<{
    id: string;
    eventId: string;
    clubId: string;
    pdfUrl?: string;
    issuedAt: string;
    pointsAwarded?: number | null;
    hoursAwarded?: number | null;
    multiplierUsed?: number | null;
  }>;
  eventsAttended: Array<{
    eventId: string;
    title: string;
    clubName: string;
    date: string;
    pointsAwarded?: number | null;
  }>;
  summary: {
    eventsAttended: number;
    badgesEarned: number;
  };
}

export const fetchAchievements = async (): Promise<AchievementsResponse> => {
  const { data } = await api.get<{ success: true; data: BackendAchievements }>(
    `/users/me/achievements`
  );
  const raw = data.data;

  // -- Earned badges ----------------------------------------------------------
  const earnedTypes = new Set(raw.badges.map((b) => b.badgeType));

  const earnedBadges: EarnedBadge[] = raw.badges.map((b) => {
    const meta = BADGE_META[b.badgeType] ?? {
      name: b.badgeType,
      description: '',
      icon: '🎖️',
      tier: 'bronze' as const,
      unlockCondition: '',
    };
    return {
      id: b.id,
      type: b.badgeType as EarnedBadge['type'],
      name: meta.name,
      description: meta.description,
      icon: meta.icon,
      tier: meta.tier,
      earnedAt: b.awardedAt,
      unlockCondition: meta.unlockCondition,
    };
  });

  // -- Locked badges with progress --------------------------------------------
  const eventsCount  = raw.summary.eventsAttended;
  const hoursCount   = raw.profile.totalVolunteerHours ?? 0;

  const progressFor = (type: string): { progress: number; label: string } => {
    switch (type) {
      case 'first_event':        return { progress: Math.min(eventsCount / 1  * 100, 100), label: `${Math.min(eventsCount, 1)} / 1 event` };
      case 'ten_events':         return { progress: Math.min(eventsCount / 10 * 100, 100), label: `${Math.min(eventsCount, 10)} / 10 events` };
      case 'twenty_five_events': return { progress: Math.min(eventsCount / 25 * 100, 100), label: `${Math.min(eventsCount, 25)} / 25 events` };
      case 'volunteer_star':     return { progress: Math.min(hoursCount  / 10 * 100, 100), label: `${Math.min(hoursCount, 10).toFixed(1)} / 10 h` };
      case 'streak_3':           return { progress: Math.min(eventsCount / 3  * 100, 100), label: `${Math.min(eventsCount, 3)} / 3 events` };
      case 'event_organiser':    return { progress: 0, label: '0 / 5 events organised' };
      case 'core_member':        return { progress: 0, label: 'Join a club as core member' };
      default:                   return { progress: 0, label: '' };
    }
  };

  const lockedBadges: LockedBadge[] = ALL_BADGE_TYPES
    .filter((type) => !earnedTypes.has(type))
    .map((type) => {
      const meta = BADGE_META[type];
      const { progress, label } = progressFor(type);
      return {
        type: type as LockedBadge['type'],
        name: meta.name,
        description: meta.description,
        icon: meta.icon,
        tier: meta.tier,
        unlockCondition: meta.unlockCondition,
        progress,
        progressLabel: label,
      };
    });

  // -- Certificates -----------------------------------------------------------
  const certificates: Certificate[] = raw.certificates.map((c) => {
    // Find the matching event title from eventsAttended (best effort)
    const matchedEvent = raw.eventsAttended.find((e) => e.eventId === c.eventId);
    return {
      id: c.id,
      eventId: c.eventId,
      eventTitle: matchedEvent?.title ?? 'Event',
      clubName: matchedEvent?.clubName ?? '',
      studentName: '',          // not needed by UI
      aictePoints: c.pointsAwarded ?? 0,
      volunteerHours: c.hoursAwarded ?? 0,
      issuedAt: c.issuedAt,
      downloadUrl: c.pdfUrl ?? `/api/v1/users/me/certificates/${c.id}/download`,
    };
  });

  return {
    totalPoints: raw.profile.totalPoints ?? 0,
    totalHours:  raw.profile.totalVolunteerHours ?? 0,
    earnedBadges,
    lockedBadges,
    certificates,
  };
};

// ─── CERTIFICATES ─────────────────────────────────────────────────────────────

export const fetchCertificates = async (): Promise<CertificatesResponse> => {
  const achievements = await fetchAchievements();
  return { certificates: achievements.certificates };
};

export async function downloadCertificate(certId: string): Promise<string> {
  // CRITICAL: responseType blob — backend sends raw binary PDF, not JSON
  const res = await api.get<Blob>(
    `/users/me/certificates/${certId}/download`,
    { responseType: 'blob' }
  );
  return URL.createObjectURL(res.data);
}

// ─── RESUME EXPORT ────────────────────────────────────────────────────────────

export const requestResumeExport = async (): Promise<ResumeExportResponse> => {
  const { data } = await api.post<{ success: true; data: ResumeExportResponse }>(
    `/users/me/resume-export`
  );
  return data.data;
};

// ─── ADMIN: ATTENDANCE METHOD CONFIG ─────────────────────────────────────────

export const fetchAttendanceMethodConfig = async (
  eventId: string
): Promise<AttendanceMethodConfig> => {
  const { data } = await api.get<{ success: true; data: AttendanceMethodConfig }>(
    `/events/${eventId}/attendance-config`
  );
  return data.data;
};

export const updateAttendanceMethodConfig = async (
  eventId: string,
  config: Omit<AttendanceMethodConfig, 'eventId'>
): Promise<AttendanceMethodConfig> => {
  const { data } = await api.put<{ success: true; data: AttendanceMethodConfig }>(
    `/events/${eventId}/attendance-config`,
    config
  );
  return data.data;
};