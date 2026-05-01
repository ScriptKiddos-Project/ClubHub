// ─── AUTH & USER ────────────────────────────────────────────────────────────

export type UserRole = 'student' | 'member' | 'secretary' | 'event_manager' | 'club_admin' | 'super_admin';
export type DegreeType = 'bachelors' | 'masters' | 'phd' | 'diploma';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
  enrollmentYear: number;
  degreeType: DegreeType;
  isVerified: boolean;
  total_points: number;
  totalVolunteerHours: number;
  avatarUrl?: string;
  gpa?: number;
  streak?: number;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  department: string;
  enrollmentYear: number;
  degreeType: DegreeType;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

export interface CoreJoinPayload {
  name: string;
  email: string;
  club_id: string;
  access_code: string;
}

// ─── CLUBS ──────────────────────────────────────────────────────────────────

// ── Club Member (returned by GET /clubs/:id/members) ─────────────────────────
export interface ClubMember {
  id:             string;       // user_id
  role:           "member" | "secretary" | "event_manager";
  joinedAt:       string;
  attendanceCount: number;
  user: {
    name:         string;
    email:        string;
    department:   string | null;
    avatarUrl:    string | null;
    total_points: number;
  };
}

export type ClubCategory =
  | 'technology'
  | 'arts_culture'
  | 'sports'
  | 'academic'
  | 'social'
  | 'career_prep'
  | 'development'
  | 'creative_arts'
  | 'technical'
  | 'cultural'
  | 'entrepreneurship'
  | 'arts'
  | 'volunteer'
  | 'other';

export type ClubStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface Club {
  id: string;
  name: string;
  slug: string;
  category: ClubCategory;
  description: string;
  logoUrl?: string;
  bannerUrl?: string;
  memberCount: number;
  status: ClubStatus;
  tags?: string[];
  skillAreas?: string[];
  socialLinks?: {
    instagram?: string;
    linkedin?: string;
    website?: string;
    twitter?: string;
  };
  isJoined?: boolean;
  upcomingEventCount?: number;
  rankingScore?: number;
  rankingTier?: 'gold' | 'silver' | 'bronze' | 'unranked';
  rankingRank?: number;
  createdAt: string;
  // Add if missing:
  userRole?: "member" | "secretary" | "event_manager" | null;
}

export interface ClubMembership {
  userId: string;
  clubId: string;
  role: 'member' | 'secretary' | 'event_manager';
  joinedAt: string;
}

// ─── EVENTS ─────────────────────────────────────────────────────────────────

export type EventType =
  | 'workshop'
  | 'seminar'
  | 'hackathon'
  | 'social'
  | 'competition'
  | 'webinar'
  | 'cultural'
  | 'sports'
  | 'meetup'
  | 'volunteer'
  | 'other';

export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';

export interface Event {
  id: string;
  clubId: string;
  club?: Pick<Club, 'id' | 'name' | 'logoUrl' | 'category'>;
  title: string;
  description: string;
  heroImageUrl?: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  capacity: number;
  registrationCount: number;
  eventType: EventType;
  status: EventStatus;
  pointsReward: number;
  volunteerHours: number;
  tags: string[];
  skillAreas?: string[];
  isFeatured?: boolean;
  bannerUrl?: string;
  isRegistered?: boolean;
  attendanceStatus?: AttendanceStatus;
  aiMatchScore?: number;
  isTrending?: boolean;
  isHot?: boolean;
  isLive?: boolean;
  isLimited?: boolean;
  isPopular?: boolean;
  createdAt: string;
}

export interface CreateEventPayload {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  capacity: number;
  eventType: EventType;
  pointsReward: number;
  volunteerHours: number;
  tags: string[];
  clubId: string;
}

export interface CalendarEvent {
  start: string;
  end: string;
  events: Event[];
}

// ─── ATTENDANCE ─────────────────────────────────────────────────────────────

export type AttendanceStatus = 'registered' | 'present' | 'late' | 'absent' | 'left_early' | 'no_show';
export type AttendanceMethod = 'qr' | 'pin' | 'manual' | 'geo';

export interface AttendanceRecord {
  userId: string;
  user?: Pick<User, 'id' | 'name' | 'email' | 'avatarUrl'>;
  eventId: string;
  status: AttendanceStatus;
  method?: AttendanceMethod;
  markedAt?: string;
  points_awarded?: number;
}

export interface QRCodeData {
  eventId: string;
  qr_code_id: string;
  validFrom: string;
  validUntil: string;
  imageUrl: string;
}

export interface PINData {
  pin: string;
  validUntil: string;
}

// ─── NOTIFICATIONS ──────────────────────────────────────────────────────────

export type NotificationType =
  | 'event_reminder'
  | 'attendance_marked'
  | 'club_update'
  | 'points_awarded'
  | 'announcement'
  | 'system';

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, string>;
}

// ─── ANALYTICS ──────────────────────────────────────────────────────────────

export interface StudentStats {
  totalEventsAttended: number;
  totalEventsRegistered: number;
  attendanceRate: number;
  total_points: number;
  totalVolunteerHours: number;
  pointsHistory: { date: string; points: number }[];
  eventsHistory: { month: string; count: number }[];
}

export interface GlobalAnalytics {
  totalUsers: number;
  totalClubs: number;
  totalEvents: number;
  totalAttendance: number;
  participationCount: number;
  avgAttendanceRate: number;
  topEvents: Event[];
}

export interface ClubAnalytics {
  memberCountOverTime: { date: string; count: number }[];
  eventCount: number;
  avgAttendanceRate: number;
  total_points_awarded: number;
}

// ─── DASHBOARD ──────────────────────────────────────────────────────────────

export interface DashboardData {
  user: User;
  myClubs: Club[];
  upcomingEvents: Event[];
  total_points: number;
  pointsToNextLevel: number;
  recentActivity: ActivityItem[];
  upcomingDeadlines: DeadlineItem[];
}

export interface ActivityItem {
  id: string;
  type: 'check_in' | 'join_club' | 'event_registered' | 'points_earned';
  message: string;
  timestamp: string;
  user?: Pick<User, 'name' | 'avatarUrl'>;
}

export interface DeadlineItem {
  id: string;
  title: string;
  date: string;
  type: 'event' | 'registration' | 'application';
}

// ─── MESSAGES ───────────────────────────────────────────────────────────────

export interface Message {
  id: string;
  senderId: string;
  sender?: Pick<User, 'id' | 'name' | 'avatarUrl'>;
  content: string;
  imageUrl?: string;
  timestamp: string;
  isRead: boolean;
}

export interface ChatRoom {
  id: string;
  name: string;
  type: 'club' | 'event' | 'dm';
  avatarUrl?: string;
  lastMessage?: Message;
  unreadCount: number;
  memberCount?: number;
  isOnline?: boolean;
}

// ─── PROFILE ────────────────────────────────────────────────────────────────

export interface ExperienceEntry {
  id: string;
  title: string;
  organization: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description: string;
  tags: string[];
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  color: string;
  earnedAt?: string;
}

export interface SkillMatrix {
  name: string;
  percentage: number;
}

export interface Achievement {
  total_points: number;
  totalHours: number;
  badges: Badge[];
  experiences: ExperienceEntry[];
  skillMatrix: SkillMatrix[];
  nextMilestone?: {
    name: string;
    date: string;
    pointsNeeded: number;
  };
}

// ─── API RESPONSES ──────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}