// services/phase4Service.ts
// Raw Axios calls for all Phase 4 endpoints.

import api from "./api";
import type {
  ChatRoom,
  ChatMessage,
  Announcement,
  RecruitmentForm,
  ApplicationField,
  Application,
  ApplicationPayload,
  InterviewSlot,
  ScheduleInterviewPayload,
  InterviewResultPayload,
  NotificationPreferences,
} from "../types/phase4";

// ─── CHAT ROOMS ──────────────────────────────────────────────────────────────

export const fetchChatRooms = async (): Promise<ChatRoom[]> => {
  const { data } = await api.get<{ success: true; data: ChatRoom[] }>(
    "/chat/rooms",
  );
  return data.data;
};

export const fetchRoomHistory = async (
  roomId: string,
  limit = 50,
): Promise<ChatMessage[]> => {
  const { data } = await api.get<{ success: true; data: ChatMessage[] }>(
    `/chat/rooms/${roomId}/messages`,
    { params: { limit } },
  );
  return data.data;
};

// ─── ANNOUNCEMENTS ───────────────────────────────────────────────────────────

// Raw shape returned by Prisma via the controller.
// DB uses snake_case; author is an included relation ({ id, name }).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawAnnouncement = any;

function normalizeAnnouncement(raw: RawAnnouncement): Announcement {
  return {
    id: raw.id,
    clubId: raw.club_id ?? raw.clubId ?? "",
    // club relation is included in some endpoints but not all
    clubName: raw.club?.name ?? raw.clubName ?? "",
    title: raw.title ?? "",
    body: raw.body ?? "",
    // author is included by getAnnouncements: { select: { id, name } }
    authorName: raw.author?.name ?? raw.authorName ?? "—",
    // Prisma returns created_at as a Date; .toISOString() normalises it
    createdAt: raw.created_at
      ? new Date(raw.created_at).toISOString()
      : (raw.createdAt ?? ""),
    // No is_pinned column in current schema — default false
    isPinned: raw.is_pinned ?? raw.isPinned ?? false,
  };
}

/**
 * Fetch announcements for the current user.
 *
 * - If a specific `clubId` is passed (admin compose page), fetch that club only.
 * - If no `clubId` is passed (student announcements feed), resolve the user's
 *   club memberships via GET /clubs/my, then fan out one request per club and
 *   merge the results. This gives students a unified cross-club feed without
 *   needing a new backend endpoint.
 */
export const fetchAnnouncements = async (
  clubId?: string,
): Promise<Announcement[]> => {
  // ── Admin / single-club path ─────────────────────────────────────────────
  if (clubId) {
    const { data } = await api.get<{ success: true; data: RawAnnouncement[] }>(
      `/clubs/${clubId}/announcements`,
    );
    return (data.data ?? []).map(normalizeAnnouncement);
  }

  // ── Student cross-club feed ──────────────────────────────────────────────
  // 1. Get all clubs the user belongs to
  let clubIds: string[] = [];
  try {
    const { data } = await api.get<{ success: true; data: { id: string }[] }>(
      "/clubs/my",
    );
    clubIds = (data.data ?? []).map((c) => c.id);
  } catch {
    // /clubs/my failed — user may have no clubs; return empty feed
    return [];
  }

  if (clubIds.length === 0) return [];

  // 2. Fetch announcements for each club in parallel, ignore individual failures
  const results = await Promise.allSettled(
    clubIds.map((id) =>
      api
        .get<{
          success: true;
          data: RawAnnouncement[];
        }>(`/clubs/${id}/announcements`)
        .then((res) =>
          (res.data.data ?? []).map((raw: RawAnnouncement) => {
            // Inject clubId so normalizer can map it even if club relation
            // isn't included in the response
            raw.club_id = raw.club_id ?? id;
            return normalizeAnnouncement(raw);
          }),
        ),
    ),
  );

  // 3. Flatten successful results; silently drop failed ones
  const all: Announcement[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      all.push(...result.value);
    }
  }

  return all;
};

export const postAnnouncement = async (
  clubId: string,
  payload: { title: string; body: string },
): Promise<Announcement> => {
  const { data } = await api.post<{ success: true; data: RawAnnouncement }>(
    `/clubs/${clubId}/announcements`,
    payload,
  );
  return normalizeAnnouncement(data.data);
};

// ─── RECRUITMENT FORM ────────────────────────────────────────────────────────

interface RawRecruitmentForm {
  id: string;
  club_id?: string;
  clubId?: string;
  club?: { name?: string };
  clubName?: string;
  title?: string;
  description?: string;
  fields?: ApplicationField[];
  deadline?: string;
  is_open?: boolean;
  isOpen?: boolean;
}

export const fetchRecruitmentForm = async (
  clubId: string,
): Promise<RecruitmentForm | null> => {
  try {
    const { data } = await api.get<{ success: true; data: RawRecruitmentForm }>(
      `/clubs/${clubId}/applications/form`,
    );
    const raw = data.data;
    if (!raw) return null;
    return {
      id: raw.id,
      clubId: raw.club_id ?? raw.clubId ?? "",
      clubName: raw.club?.name ?? raw.clubName ?? "",
      title: raw.title ?? "",
      description: raw.description ?? "",
      fields: raw.fields ?? [],
      deadline: raw.deadline,
      isOpen: raw.is_open ?? raw.isOpen ?? false,
    };
  } catch {
    return null;
  }
};

export const upsertRecruitmentForm = async (
  clubId: string,
  payload: Omit<RecruitmentForm, "id" | "clubId" | "clubName">,
): Promise<RecruitmentForm> => {
  const { data } = await api.put<{ success: true; data: RecruitmentForm }>(
    `/clubs/${clubId}/applications/form`,
    payload,
  );
  return data.data;
};

// ─── APPLICATIONS ────────────────────────────────────────────────────────────

export const submitApplication = async (
  clubId: string,
  payload: ApplicationPayload,
): Promise<Application> => {
  const { data } = await api.post<{ success: true; data: Application }>(
    `/clubs/${clubId}/applications`,
    { formData: payload.answers },
  );
  return normalizeApplication(data.data);
};

export const fetchApplications = async (
  clubId: string,
): Promise<Application[]> => {
  const { data } = await api.get<{ success: true; data: unknown[] }>(
    `/clubs/${clubId}/applications`,
  );
  return (data.data ?? []).map(normalizeApplication);
};

export const updateApplicationStatus = async (
  clubId: string,
  applicationId: string,
  status: "shortlisted" | "rejected",
  notes?: string,
): Promise<Application> => {
  const { data } = await api.patch<{ success: true; data: unknown }>(
    `/clubs/${clubId}/applications/${applicationId}`,
    { status, notes },
  );
  return normalizeApplication(data.data);
};

// ─── INTERVIEWS ───────────────────────────────────────────────────────────────

export const scheduleInterview = async (
  clubId: string,
  payload: ScheduleInterviewPayload,
): Promise<InterviewSlot> => {
  const { data } = await api.post<{ success: true; data: unknown }>(
    `/clubs/${clubId}/interviews`,
    {
      applicationId: payload.applicationId,
      candidateId: payload.candidateId,
      slotTime: new Date(payload.scheduledAt).toISOString(), // always valid ISO
      durationMins: payload.durationMins,
      location: payload.location,
      meetLink: payload.meetLink,
    },
  );
  return normalizeInterview(data.data);
};

export const fetchInterviews = async (
  clubId: string,
): Promise<InterviewSlot[]> => {
  const { data } = await api.get<{ success: true; data: unknown[] }>(
    `/clubs/${clubId}/interviews`,
  );
  return (data.data ?? []).map(normalizeInterview);
};

export const recordInterviewResult = async (
  interviewId: string,
  payload: InterviewResultPayload,
): Promise<InterviewSlot> => {
  const { data } = await api.patch<{ success: true; data: unknown }>(
    `/interviews/${interviewId}/result`,
    payload,
  );
  return normalizeInterview(data.data);
};

// ─── NOTIFICATION PREFERENCES ────────────────────────────────────────────────

export const fetchNotificationPreferences =
  async (): Promise<NotificationPreferences> => {
    const { data } = await api.get<{
      success: true;
      data: NotificationPreferences;
    }>("/users/me/notification-preferences");
    return data.data;
  };

export const saveNotificationPreferences = async (
  prefs: NotificationPreferences,
): Promise<NotificationPreferences> => {
  const { data } = await api.put<{
    success: true;
    data: NotificationPreferences;
  }>("/users/me/notification-preferences", prefs);
  return data.data;
};

// ─── NORMALIZERS ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeApplication(raw: any): Application {
  return {
    id: raw.id,
    formId: raw.form_id ?? raw.formId ?? "",
    clubId: raw.club_id ?? raw.clubId ?? "",
    clubName: raw.club?.name ?? raw.clubName ?? "",
    applicantId: raw.user_id ?? raw.applicantId ?? "",
    applicantName:
      raw.applicant?.name ?? raw.user?.name ?? raw.applicantName ?? "—",
    applicantEmail:
      raw.applicant?.email ?? raw.user?.email ?? raw.applicantEmail ?? "—",
    applicantDept:
      raw.applicant?.department ??
      raw.user?.department ??
      raw.applicantDept ??
      "",
    answers: raw.form_data ?? raw.answers ?? {},
    status: raw.status,
    submittedAt: raw.created_at ?? raw.submittedAt ?? "",
    notes: raw.notes,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeInterview(raw: any): InterviewSlot {
  return {
    id: raw.id,
    clubId: raw.club_id ?? raw.clubId ?? "",
    applicationId: raw.application_id ?? raw.applicationId ?? "",
    applicantId: raw.candidate_id ?? raw.applicantId ?? "",
    applicantName: raw.candidate?.name ?? raw.applicantName ?? "—",
    applicantEmail: raw.candidate?.email ?? raw.applicantEmail ?? "—",
    scheduledAt: raw.slot_time ?? raw.scheduledAt ?? "",
    durationMins: raw.duration_mins ?? raw.durationMins ?? 30,
    location: raw.location,
    meetLink: raw.meet_link ?? raw.meetLink,
    result: raw.result ?? "pending",
    resultNotes: raw.result_notes ?? raw.resultNotes,
  };
}

export interface MyApplicationStatus {
  id: string;
  status: "pending" | "shortlisted" | "rejected" | "accepted";
  created_at: string;
}

export const fetchMyApplication = async (
  clubId: string,
): Promise<MyApplicationStatus | null> => {
  try {
    const { data } = await api.get<{
      success: true;
      data: MyApplicationStatus | null;
    }>(`/clubs/${clubId}/applications/my`);
    return data.data ?? null;
  } catch {
    return null;
  }
};
