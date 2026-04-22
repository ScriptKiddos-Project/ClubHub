import type {
  Club,
  DashboardData,
  Event,
  Notification,
  StudentStats,
  User,
} from '../types';

type UnknownRecord = Record<string, unknown>;

const clubCategoryMap: Record<string, Club['category']> = {
  technical: 'technology',
  cultural: 'arts_culture',
  sports: 'sports',
  social: 'social',
  academic: 'academic',
  entrepreneurship: 'career_prep',
  arts: 'creative_arts',
  volunteer: 'development',
  other: 'development',
  technology: 'technology',
  arts_culture: 'arts_culture',
  career_prep: 'career_prep',
  development: 'development',
  creative_arts: 'creative_arts',
};

const clubCategoryApiMap: Record<string, string> = {
  technology: 'technical',
  arts_culture: 'cultural',
  sports: 'sports',
  social: 'social',
  academic: 'academic',
  career_prep: 'entrepreneurship',
  development: 'technical',
  creative_arts: 'arts',
};

const eventTypeMap: Record<string, Event['eventType']> = {
  workshop: 'workshop',
  seminar: 'seminar',
  hackathon: 'hackathon',
  cultural: 'social',
  sports: 'competition',
  webinar: 'webinar',
  meetup: 'social',
  competition: 'competition',
  volunteer: 'social',
  other: 'seminar',
  social: 'social',
};

const asRecord = (value: unknown): UnknownRecord =>
  value && typeof value === 'object' ? (value as UnknownRecord) : {};

const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const asNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const asBoolean = (value: unknown, fallback = false): boolean =>
  typeof value === 'boolean' ? value : fallback;

const isoString = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  return new Date().toISOString();
};

const timeFromIso = (value: unknown): string => {
  const date = new Date(isoString(value));
  if (Number.isNaN(date.getTime())) return '00:00';
  return date.toISOString().slice(11, 16);
};

export const mapClubCategoryToApi = (category?: string): string | undefined =>
  category ? clubCategoryApiMap[category] ?? category : undefined;

export const normalizeUser = (value: unknown): User => {
  const raw = asRecord(value);

  return {
    id: asString(raw.id),
    email: asString(raw.email),
    name: asString(raw.name, 'ClubHub User'),
    role: asString(raw.role, 'student') as User['role'],
    department: asString(raw.department),
    enrollmentYear: asNumber(raw.enrollmentYear ?? raw.enrollment_year),
    degreeType: asString(raw.degreeType ?? raw.degree_type, 'bachelors') as User['degreeType'],
    isVerified: asBoolean(raw.isVerified ?? raw.is_verified, true),
    total_points: asNumber(raw.total_points),
    totalVolunteerHours: asNumber(raw.totalVolunteerHours ?? raw.total_volunteer_hours),
    avatarUrl: asString(raw.avatarUrl ?? raw.avatar_url) || undefined,
    gpa: typeof raw.gpa === 'number' ? raw.gpa : undefined,
    streak: typeof raw.streak === 'number' ? raw.streak : undefined,
    createdAt: isoString(raw.createdAt ?? raw.created_at ?? new Date().toISOString()),
  };
};

export const normalizeClub = (value: unknown): Club => {
  const raw = asRecord(value);

  return {
    id: asString(raw.id),
    name: asString(raw.name),
    slug: asString(raw.slug),
    category: clubCategoryMap[asString(raw.category)] ?? 'development',
    description: asString(raw.description),
    logoUrl: asString(raw.logoUrl ?? raw.logo_url) || undefined,
    bannerUrl: asString(raw.bannerUrl ?? raw.banner_url) || undefined,
    memberCount: asNumber(raw.memberCount ?? raw.member_count),
    status: asString(raw.status, 'approved') as Club['status'],
    socialLinks: {
      instagram: asString(raw.instagramUrl ?? raw.instagram_url) || undefined,
      linkedin: asString(raw.linkedinUrl ?? raw.linkedin_url) || undefined,
      website: asString(raw.websiteUrl ?? raw.website_url) || undefined,
    },
    isJoined: asBoolean(raw.isJoined ?? raw.is_member),
    upcomingEventCount: Array.isArray(raw.upcoming_events)
      ? raw.upcoming_events.length
      : typeof raw.upcomingEventCount === 'number'
      ? raw.upcomingEventCount
      : undefined,
    rankingScore: typeof raw.rankingScore === 'number' ? raw.rankingScore : undefined,
    createdAt: isoString(raw.createdAt ?? raw.created_at ?? new Date().toISOString()),
  };
};

export const normalizeEvent = (value: unknown): Event => {
  const raw = asRecord(value);
  const rawClub = asRecord(raw.club);
  const clubCategory = asString(raw.club_category ?? rawClub.category);

  return {
    id: asString(raw.id),
    clubId: asString(raw.clubId ?? raw.club_id),
    club:
      raw.club || raw.club_name
        ? {
            id: asString(raw.club_id ?? rawClub.id),
            name: asString(raw.club_name ?? rawClub.name),
            logoUrl: asString(raw.club_logo ?? rawClub.logoUrl ?? rawClub.logo_url) || undefined,
            category: clubCategoryMap[clubCategory] ?? 'development',
          }
        : undefined,
    title: asString(raw.title),
    description: asString(raw.description),
    heroImageUrl: asString(raw.heroImageUrl ?? raw.banner_url ?? raw.hero_image_url) || undefined,
    date: isoString(raw.date),
    startTime: timeFromIso(raw.date),
    endTime: raw.end_date ? timeFromIso(raw.end_date) : timeFromIso(raw.date),
    venue: asString(raw.venue),
    capacity: asNumber(raw.capacity),
    registrationCount: asNumber(raw.registrationCount ?? raw.registration_count),
    eventType: eventTypeMap[asString(raw.eventType ?? raw.event_type)] ?? 'seminar',
    status: asBoolean(raw.is_published, true) ? 'published' : 'draft',
    pointsReward: asNumber(raw.pointsReward ?? raw.points_reward),
    volunteerHours: asNumber(raw.volunteerHours ?? raw.volunteer_hours),
    tags: Array.isArray(raw.tags) ? raw.tags.map((tag) => String(tag)) : [],
    isRegistered: asBoolean(raw.isRegistered ?? raw.is_registered),
    attendanceStatus:
      typeof raw.attendanceStatus === 'string'
        ? (raw.attendanceStatus as Event['attendanceStatus'])
        : undefined,
    aiMatchScore: typeof raw.aiMatchScore === 'number' ? raw.aiMatchScore : undefined,
    isTrending: asBoolean(raw.isTrending),
    isHot: asBoolean(raw.isHot),
    isLive: asBoolean(raw.isLive),
    isLimited: asBoolean(raw.isLimited),
    isPopular: asBoolean(raw.isPopular),
    createdAt: isoString(raw.createdAt ?? raw.created_at ?? raw.date),
  };
};

export const normalizeNotification = (value: unknown): Notification => {
  const raw = asRecord(value);
  const metadata = asRecord(raw.metadata);

  return {
    id: asString(raw.id),
    title: asString(raw.title),
    body: asString(raw.body),
    type: asString(raw.type, 'system') as Notification['type'],
    isRead: asBoolean(raw.isRead ?? raw.is_read),
    createdAt: isoString(raw.createdAt ?? raw.created_at ?? new Date().toISOString()),
    metadata:
      Object.keys(metadata).length > 0
        ? Object.fromEntries(Object.entries(metadata).map(([key, item]) => [key, String(item)]))
        : undefined,
  };
};

export const normalizeDashboard = (value: unknown): DashboardData => {
  const raw = asRecord(value);
  const stats = asRecord(raw.stats);
  const user = normalizeUser({
    ...asRecord(raw.user),
    total_points: stats.total_points ?? asRecord(raw.user).total_points,
    total_volunteer_hours: stats.total_volunteer_hours ?? asRecord(raw.user).total_volunteer_hours,
  });
  const upcomingEvents = Array.isArray(raw.upcoming_events)
    ? raw.upcoming_events.map(normalizeEvent)
    : [];

  return {
    user,
    myClubs: Array.isArray(raw.my_clubs) ? raw.my_clubs.map(normalizeClub) : [],
    upcomingEvents,
    total_points: asNumber(stats.total_points, user.total_points),
    pointsToNextLevel: Math.max(0, 3000 - asNumber(stats.total_points, user.total_points)),
    recentActivity: [],
    upcomingDeadlines: upcomingEvents.slice(0, 3).map((event) => ({
      id: event.id,
      title: event.title,
      date: event.date,
      type: 'event',
    })),
  };
};

export const normalizeStudentStats = (value: unknown): StudentStats => {
  const raw = asRecord(value);

  return {
    totalEventsAttended: asNumber(raw.totalEventsAttended),
    totalEventsRegistered: asNumber(raw.totalEventsRegistered),
    attendanceRate: asNumber(raw.attendanceRate),
    total_points: asNumber(raw.totalPoints ?? raw.total_points),
    totalVolunteerHours: asNumber(raw.totalVolunteerHours),
    pointsHistory: Array.isArray(raw.pointsHistory)
      ? raw.pointsHistory.map((item) => {
          const row = asRecord(item);
          return {
            date: isoString(row.date),
            points: asNumber(row.points),
          };
        })
      : [],
    eventsHistory: [],
  };
};
