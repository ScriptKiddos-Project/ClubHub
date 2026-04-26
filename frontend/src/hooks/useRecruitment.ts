// hooks/useRecruitment.ts
// Data-fetching & mutation hooks for recruitment forms, applications,
// and interview scheduling.

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  fetchRecruitmentForm,
  submitApplication,
  fetchApplications,
  updateApplicationStatus,
  scheduleInterview,
  fetchInterviews,
  recordInterviewResult,
  fetchNotificationPreferences,
  saveNotificationPreferences,
  fetchAnnouncements,
  postAnnouncement,
} from '../services/phase4Service';
import type {
  RecruitmentForm,
  Application,
  ApplicationPayload,
  InterviewSlot,
  ScheduleInterviewPayload,
  InterviewResultPayload,
  NotificationPreferences,
  Announcement,
} from '../types/phase4';

// ─── useRecruitmentForm (student) ─────────────────────────────────────────────
export const useRecruitmentForm = (clubId: string) => {
  const [form, setForm] = useState<RecruitmentForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!clubId) return;
    fetchRecruitmentForm(clubId)
      .then(setForm)
      .finally(() => setLoading(false));
  }, [clubId]);

  const submitForm = async (payload: ApplicationPayload): Promise<boolean> => {
    setSubmitting(true);
    try {
      await submitApplication(clubId, payload);
      setSubmitted(true);
      toast.success('Application submitted! Good luck 🎉');
      return true;
    } catch {
      toast.error('Submission failed. Please try again.');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return { form, loading, submitting, submitted, submitForm };
};

// ─── useApplications (admin) ───────────────────────────────────────────────────
export const useApplications = (clubId: string) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!clubId) return;
    try {
      setApplications(await fetchApplications(clubId));
    } catch {
      toast.error('Failed to load applications.');
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (
    applicationId: string,
    status: 'shortlisted' | 'rejected',
    notes?: string
  ) => {
    setUpdating(applicationId);
    try {
      const updated = await updateApplicationStatus(clubId, applicationId, status, notes);
      setApplications((prev) =>
        prev.map((a) => (a.id === applicationId ? updated : a))
      );
      toast.success(`Application ${status}.`);
    } catch {
      toast.error('Update failed.');
    } finally {
      setUpdating(null);
    }
  };

  return { applications, loading, updating, updateStatus, refetch: load };
};

// ─── useInterviews (admin) ────────────────────────────────────────────────────
export const useInterviews = (clubId: string) => {
  const [interviews, setInterviews] = useState<InterviewSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduling, setScheduling] = useState(false);
  const [recording, setRecording] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!clubId) return;
    try {
      setInterviews(await fetchInterviews(clubId));
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [clubId]);

  useEffect(() => { load(); }, [load]);

  const schedule = async (payload: ScheduleInterviewPayload): Promise<boolean> => {
    setScheduling(true);
    try {
      const slot = await scheduleInterview(clubId, payload);
      setInterviews((prev) => [...prev, slot]);
      toast.success('Interview scheduled — calendar invite sent!');
      return true;
    } catch {
      toast.error('Could not schedule interview.');
      return false;
    } finally {
      setScheduling(false);
    }
  };

  const recordResult = async (
    interviewId: string,
    payload: InterviewResultPayload
  ): Promise<boolean> => {
    setRecording(interviewId);
    try {
      const updated = await recordInterviewResult(interviewId, payload);
      setInterviews((prev) =>
        prev.map((iv) => (iv.id === interviewId ? updated : iv))
      );
      const label = payload.result === 'accepted' ? 'accepted ✅' : 'rejected';
      toast.success(`Candidate ${label}. Notification email sent.`);
      return true;
    } catch {
      toast.error('Could not record result.');
      return false;
    } finally {
      setRecording(null);
    }
  };

  return { interviews, loading, scheduling, recording, schedule, recordResult, refetch: load };
};

// ─── useNotificationPreferences ───────────────────────────────────────────────
export const useNotificationPreferences = () => {
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchNotificationPreferences()
      .then(setPrefs)
      .catch(() => { /* non-critical */ })
      .finally(() => setLoading(false));
  }, []);

  const save = async (updated: NotificationPreferences) => {
    setSaving(true);
    try {
      const res = await saveNotificationPreferences(updated);
      setPrefs(res);
      toast.success('Notification preferences saved.');
    } catch {
      toast.error('Could not save preferences.');
    } finally {
      setSaving(false);
    }
  };

  return { prefs, loading, saving, save };
};

// ─── useAnnouncements ─────────────────────────────────────────────────────────
export const useAnnouncements = (clubId?: string) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetchAnnouncements(clubId)
      .then(setAnnouncements)
      .catch(() => { /* silent */ })
      .finally(() => setLoading(false));
  }, [clubId]);

  const post = async (payload: { title: string; body: string }): Promise<boolean> => {
    if (!clubId) return false;
    setPosting(true);
    try {
      const ann = await postAnnouncement(clubId, payload);
      setAnnouncements((prev) => [ann, ...prev]);
      toast.success('Announcement posted to all club members!');
      return true;
    } catch {
      toast.error('Could not post announcement.');
      return false;
    } finally {
      setPosting(false);
    }
  };

  return { announcements, loading, posting, post };
};