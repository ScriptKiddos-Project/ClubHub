// src/utils/geoUtils.ts
// Phase 3 — Geo-fence helpers & AICTE points multiplier logic

import { ClubMemberRole, Role } from '@prisma/client';

// ── Haversine Distance (metres) ───────────────────────────────────────────────

/**
 * Returns the great-circle distance in metres between two GPS coordinates
 * using the Haversine formula.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6_371_000; // Earth radius in metres
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Returns true when the student is within `radiusMetres` of the venue.
 */
export function isWithinGeoFence(
  studentLat: number,
  studentLon: number,
  venueLat: number,
  venueLon: number,
  radiusMetres: number
): boolean {
  return haversineDistance(studentLat, studentLon, venueLat, venueLon) <= radiusMetres;
}

// ── AICTE Points Multiplier ───────────────────────────────────────────────────

/**
 * AICTE multiplier table (from Blueprint Phase 3):
 *   Non-member / student  →  1.0×
 *   Member                →  1.1×  (points)
 *   Secretary / Event Mgr → Working-Committee → 2.0× volunteer hours
 *   Core (club_admin)     →  3.0×  volunteer hours
 *
 * We apply one multiplier to both points and hours for simplicity; the
 * blueprint only specifies hours for WC/Core but we extend it uniformly
 * so the FE can show a consistent multiplier badge.
 */
export type AICTEMultiplierResult = {
  pointsMultiplier: number;
  hoursMultiplier: number;
  tier: 'non_member' | 'member' | 'working_committee' | 'core';
};

export function getAICTEMultiplier(
  globalRole: Role,
  clubRole: ClubMemberRole | null
): AICTEMultiplierResult {
  // Club admin / super admin = core
  if (globalRole === 'club_admin' || globalRole === 'super_admin') {
    return { pointsMultiplier: 3.0, hoursMultiplier: 3.0, tier: 'core' };
  }

  if (clubRole === 'secretary' || clubRole === 'event_manager') {
    return { pointsMultiplier: 2.0, hoursMultiplier: 2.0, tier: 'working_committee' };
  }

  if (clubRole === 'member' || globalRole === 'member') {
    return { pointsMultiplier: 1.1, hoursMultiplier: 1.1, tier: 'member' };
  }

  // student with no club membership
  return { pointsMultiplier: 1.0, hoursMultiplier: 1.0, tier: 'non_member' };
}
