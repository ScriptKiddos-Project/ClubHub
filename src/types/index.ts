// server/src/types/index.ts
import {
  Role,
  ClubMemberRole,
  DegreeType,
  AttendanceStatus,
  AttendanceMethod,
  ClubCategory,
  ClubStatus,
  EventType,
  NotificationType,
} from "@prisma/client";

// ── Re-export Prisma enums — single source of truth ──────────────────────────
export {
  Role,
  ClubMemberRole,
  DegreeType,
  AttendanceStatus,
  AttendanceMethod,
  ClubCategory,
  ClubStatus,
  EventType,
  NotificationType,
};

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthenticatedUser {
  id:    string;
  email: string;
  role:  Role;
  name:  string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

// ── Pagination ────────────────────────────────────────────────────────────────

export interface PaginationParams {
  page?:   number;
  limit?:  number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total?:       number;
    page?:        number;
    limit?:       number;
    has_more:     boolean;
    next_cursor?: string | null;
  };
}

// ── API Response ──────────────────────────────────────────────────────────────

export interface ApiSuccess<T = unknown> {
  success: true;
  data:    T;
  meta?:   Record<string, unknown>;
}

export interface ApiError {
  success: false;
  error: {
    code:     string;
    message:  string;
    details?: unknown;
  };
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ── Club Types ────────────────────────────────────────────────────────────────

export interface ClubListItem {
  id:           string;
  name:         string;
  slug:         string;
  category:     ClubCategory;
  logo_url:     string | null;
  member_count: number;
  status:       ClubStatus;
  description:  string | null;
}

export interface ClubDetail extends ClubListItem {
  banner_url:      string | null;
  website_url:     string | null;
  instagram_url:   string | null;
  linkedin_url:    string | null;
  twitter_url:     string | null;
  upcoming_events: EventListItem[];
  is_member:       boolean;
  user_role:       ClubMemberRole | null;
  created_at:      Date;
}

export interface CreateClubInput {
  name:          string;
  description?:  string;
  category:      ClubCategory;
  logo_url?:     string;
  banner_url?:   string;
  website_url?:  string;
  instagram_url?: string;
  linkedin_url?: string;
  twitter_url?:  string;
}

export interface ApproveClubInput {
  approved: boolean;
  reason?:  string;
}

export interface ClubFilters {
  category?: ClubCategory;
  search?:   string;
  page?:     number;
  limit?:    number;
}

// ── Event Types ───────────────────────────────────────────────────────────────

export interface EventListItem {
  id:                    string;
  club_id:               string;
  club_name?:            string;
  club_logo?:            string | null;
  title:                 string;
  date:                  Date;
  end_date:              Date | null;
  venue:                 string;
  capacity:              number;
  registration_count:    number;
  event_type:            EventType;
  is_published:          boolean;
  is_free:               boolean;
  points_reward:         number;
  volunteer_hours:       number;
  tags:                  string[];
  banner_url:            string | null;
  registration_deadline: Date | null;
  is_registered?:        boolean;
  spots_left?:           number;
}

export interface EventDetail extends EventListItem {
  description:             string;
  qr_attendance_enabled:   boolean;
  pin_attendance_enabled:  boolean;
  created_by:              string;
  created_at:              Date;
  updated_at:              Date;
}

export interface CreateEventInput {
  club_id:               string;
  title:                 string;
  description:           string;
  date:                  Date | string;
  end_date?:             Date | string;
  venue:                 string;
  capacity:              number;
  registration_deadline?: Date | string;
  event_type:            EventType;
  is_published?:         boolean;
  points_reward?:        number;
  volunteer_hours?:      number;
  tags?:                 string[];
  is_free?:              boolean;
  qr_attendance_enabled?: boolean;
  pin_attendance_enabled?: boolean;
  banner_url?:           string;
}

export interface UpdateEventInput extends Partial<CreateEventInput> {}

export interface EventFilters {
  club_id?:     string;
  type?:        EventType;
  date_from?:   string;
  date_to?:     string;
  is_published?: boolean;
  is_free?:     boolean;
  tags?:        string[];
  cursor?:      string;
  limit?:       number;
}

// ── Event Registration ────────────────────────────────────────────────────────

export interface EventRegistrationRecord {
  id:             string;
  event_id:       string;
  user_id:        string;
  status:         AttendanceStatus;
  attended:       boolean;
  points_awarded: number | null;
  hours_awarded:  number | null;
  registered_at:  Date;
  user?: {
    id:              string;
    name:            string;
    email:           string;
    department:      string | null;
    enrollment_year: number | null;
  };
}

// ── Calendar ──────────────────────────────────────────────────────────────────

export interface CalendarEvent {
  id:            string;
  title:         string;
  date:          Date;
  end_date:      Date | null;
  event_type:    EventType;
  club_name:     string;
  club_id:       string;
  is_registered: boolean;
  venue:         string;
}

export interface CalendarResponse {
  start:  string;
  end:    string;
  events: CalendarEvent[];
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface StudentDashboard {
  user: {
    id:                    string;
    name:                  string;
    email:                 string;
    total_points:          number;
    total_volunteer_hours: number;
  };
  my_clubs:        ClubListItem[];
  upcoming_events: EventListItem[];
  stats: {
    clubs_joined:          number;
    events_registered:     number;
    events_attended:       number;
    total_points:          number;
    total_volunteer_hours: number;
  };
}

// ── QR Code (Phase 1C) ────────────────────────────────────────────────────────

export interface QRCodePayload {
  eventId:    string;
  qrCodeId:   string;
  validFrom:  number;   // Unix timestamp
  validUntil: number;
  version:    number;
}

// ── Attendance (Phase 1C) ─────────────────────────────────────────────────────

export interface BulkAttendanceItem {
  userId: string;
  status: AttendanceStatus;
}

export interface AttendanceReportRow {
  userId:        string;
  name:          string;
  email:         string;
  department:    string | null;
  status:        AttendanceStatus;
  markedAt:      Date | null;
  method:        AttendanceMethod | null;
  pointsAwarded: boolean;
}