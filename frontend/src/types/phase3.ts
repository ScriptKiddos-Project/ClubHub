// ─── PHASE 3: Attendance Pro, AICTE Points & Profile System ─────────────────

// ─── AICTE POINTS & MULTIPLIERS ─────────────────────────────────────────────

export type MemberType = 'non_member' | 'member' | 'working_committee' | 'core_member';

export const AICTE_MULTIPLIERS: Record<MemberType, number> = {
  non_member: 1.0,
  member: 1.1,
  working_committee: 2.0,
  core_member: 3.0,
};

export interface PointsHistoryEntry {
  id: string;
  eventId: string;
  eventTitle: string;
  clubName: string;
  basePoints: number;
  multiplier: number;
  finalPoints: number;
  volunteerHours: number;
  memberType: MemberType;
  earnedAt: string;
}

export interface PointsHistoryResponse {
  entries: PointsHistoryEntry[];
  totalPoints: number;
  totalHours: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── ATTENDANCE STATES (EXTENDED) ────────────────────────────────────────────

export type AttendanceState =
  | 'registered'
  | 'present'
  | 'late'
  | 'left_early'
  | 'absent'
  | 'no_show';

export type AttendanceMethod = 'qr' | 'geo' | 'pin' | 'manual';

// ─── GEO-FENCE ATTENDANCE ────────────────────────────────────────────────────

export interface GeoAttendancePayload {
  latitude: number;
  longitude: number;
}

export interface GeoAttendanceResult {
  success: boolean;
  distance: number;           // metres from event venue
  radius: number;             // configured geo_fence_radius
  withinFence: boolean;
  attendanceMarked: boolean;
  message: string;
}

export interface EventVenueCoords {
  latitude: number;
  longitude: number;
  geoFenceRadius: number;     // metres
}

// ─── CERTIFICATES ────────────────────────────────────────────────────────────

export interface Certificate {
  id: string;
  eventId: string;
  eventTitle: string;
  clubName: string;
  studentName: string;
  aictePoints: number;
  volunteerHours: number;
  issuedAt: string;
  downloadUrl: string;
}

export interface CertificatesResponse {
  certificates: Certificate[];
}

// ─── BADGES ──────────────────────────────────────────────────────────────────

export type BadgeType =
  | 'events_10'
  | 'events_25'
  | 'events_50'
  | 'core_member'
  | 'working_committee'
  | 'volunteer_10h'
  | 'volunteer_50h'
  | 'volunteer_100h'
  | 'points_100'
  | 'points_500'
  | 'points_1000'
  | 'club_founder'
  | 'perfect_attendance';

export interface EarnedBadge {
  id: string;
  type: BadgeType;
  name: string;
  description: string;
  icon: string;            // emoji or icon name
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  earnedAt: string;
  unlockCondition: string;
}

export interface LockedBadge {
  type: BadgeType;
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  unlockCondition: string;
  progress: number;        // 0–100
  progressLabel: string;   // e.g. "7 / 10 events"
}

// ─── ACHIEVEMENTS ─────────────────────────────────────────────────────────────

export interface AchievementsResponse {
  totalPoints: number;
  totalHours: number;
  earnedBadges: EarnedBadge[];
  lockedBadges: LockedBadge[];
  certificates: Certificate[];
}

// ─── RESUME EXPORT ───────────────────────────────────────────────────────────

export interface ResumeExportResponse {
  downloadUrl: string;
  expiresAt: string;
}

// ─── ADMIN: ATTENDANCE METHOD CONFIG ─────────────────────────────────────────

export interface AttendanceMethodConfig {
  eventId: string;
  qrEnabled: boolean;
  geoEnabled: boolean;
  pinEnabled: boolean;
  manualEnabled: boolean;
}
