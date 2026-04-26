// types/phase4.ts
// All TypeScript types for Phase 4: Chat, Recruitment, Interviews,
// Smart Notifications, and Notification Preferences.

// ─── CHAT ────────────────────────────────────────────────────────────────────

export type ChatRoomType = 'club' | 'event' | 'announcement';

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;       // ISO string
  isOwn?: boolean;         // derived client-side from auth user id
  isDeleted?: boolean;
  replyTo?: {
    messageId: string;
    senderName: string;
    contentPreview: string;
  };
}

export interface ChatRoom {
  id: string;
  name: string;
  type: ChatRoomType;
  entityId: string;        // clubId or eventId
  avatarUrl?: string;
  memberCount: number;
  isArchived: boolean;     // event chats archived 48h after event end
  lastMessage?: {
    content: string;
    senderName: string;
    timestamp: string;
  };
  unreadCount: number;
}

// Socket.io event shapes ─────────────────────────────────────────────────────
export interface SocketChatMessage {
  roomId: string;
  content: string;
}

export interface SocketChatEvent {
  message: ChatMessage;
}

// ─── ANNOUNCEMENTS ───────────────────────────────────────────────────────────

export interface Announcement {
  id: string;
  clubId: string;
  clubName: string;
  title: string;
  body: string;
  authorName: string;
  createdAt: string;
  isPinned: boolean;
}

// ─── RECRUITMENT ─────────────────────────────────────────────────────────────

export type ApplicationStatus = 'pending' | 'shortlisted' | 'rejected' | 'accepted';

export interface ApplicationField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  required: boolean;
  options?: string[];       // for 'select' type
}

export interface RecruitmentForm {
  id: string;
  clubId: string;
  clubName: string;
  title: string;
  description: string;
  fields: ApplicationField[];
  deadline?: string;
  isOpen: boolean;
}

export interface Application {
  id: string;
  formId: string;
  clubId: string;
  clubName: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  applicantDept?: string;
  answers: Record<string, string>;   // fieldId → answer
  status: ApplicationStatus;
  submittedAt: string;
  notes?: string;                    // admin-only notes
}

export interface ApplicationPayload {
  formId: string;
  answers: Record<string, string>;
}

// ─── INTERVIEWS ───────────────────────────────────────────────────────────────

export type InterviewResult = 'pending' | 'accepted' | 'rejected';

export interface InterviewSlot {
  id: string;
  clubId: string;
  applicationId: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  scheduledAt: string;     // ISO string
  durationMins: number;
  location?: string;
  meetLink?: string;
  result: InterviewResult;
  resultNotes?: string;
}

export interface ScheduleInterviewPayload {
  applicationId: string;
  scheduledAt: string;
  durationMins: number;
  location?: string;
  meetLink?: string;
}

export interface InterviewResultPayload {
  result: 'accepted' | 'rejected';
  notes?: string;
}

// ─── SMART NOTIFICATIONS ─────────────────────────────────────────────────────

export type NotificationPriority = 'critical' | 'standard' | 'low';

export interface SmartNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  priority: NotificationPriority;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, string>;
}

// ─── NOTIFICATION PREFERENCES ────────────────────────────────────────────────

export interface NotificationPreferences {
  email: {
    eventReminders: boolean;
    clubAnnouncements: boolean;
    attendanceConfirmations: boolean;
    recruitmentUpdates: boolean;
    interviewInvites: boolean;
  };
  push: {
    eventReminders: boolean;
    clubAnnouncements: boolean;
    attendanceConfirmations: boolean;
    recruitmentUpdates: boolean;
    interviewInvites: boolean;
  };
  inApp: {
    all: boolean;
    criticalOnly: boolean;
  };
}