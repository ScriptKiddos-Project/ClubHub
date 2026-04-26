// pages/admin/RecruitmentDashboardPage.tsx
// Phase 4: Admin view — applicant list, shortlist/reject, schedule interviews,
// record results. All under one tabbed page per club.

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Users, Calendar, CheckCircle, XCircle, Clock,
  Loader2, ChevronDown, ChevronUp, Send,
} from 'lucide-react';
import { cn } from '../../utils';
import { Card, Badge, Avatar } from '../../components/ui';
import {
  fetchApplications,
  updateApplicationStatus,
  fetchInterviews,
  scheduleInterview,
  recordInterviewResult,
} from '../../services/phase4Service';
import type { Application, InterviewSlot, ApplicationStatus } from '../../types/phase4';
import toast from 'react-hot-toast';

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<ApplicationStatus, string> = {
  pending:     'bg-gray-100 text-gray-600',
  shortlisted: 'bg-blue-100 text-blue-700',
  rejected:    'bg-red-100 text-red-600',
  accepted:    'bg-emerald-100 text-emerald-700',
};

const StatusBadge: React.FC<{ status: ApplicationStatus }> = ({ status }) => (
  <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize', STATUS_STYLES[status])}>
    {status}
  </span>
);

// ── Application row ───────────────────────────────────────────────────────────
const ApplicationRow: React.FC<{
  app: Application;
  onStatusChange: (id: string, status: 'shortlisted' | 'rejected') => void;
  onSchedule: (app: Application) => void;
  updating: boolean;
}> = ({ app, onStatusChange, onSchedule, updating }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      {/* Row header */}
      <div className="flex items-center gap-3 p-4">
        <Avatar name={app.applicantName} size="sm" className="shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{app.applicantName}</p>
          <p className="text-xs text-gray-500">{app.applicantEmail} · {app.applicantDept}</p>
        </div>
        <StatusBadge status={app.status} />
        <p className="text-[11px] text-gray-400 shrink-0 hidden sm:block">
          {new Date(app.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {app.status === 'pending' && (
            <>
              <button
                onClick={() => onStatusChange(app.id, 'shortlisted')}
                disabled={updating}
                title="Shortlist"
                className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors"
              >
                <CheckCircle size={14} />
              </button>
              <button
                onClick={() => onStatusChange(app.id, 'rejected')}
                disabled={updating}
                title="Reject"
                className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"
              >
                <XCircle size={14} />
              </button>
            </>
          )}
          {app.status === 'shortlisted' && (
            <button
              onClick={() => onSchedule(app)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-semibold transition-colors"
            >
              <Calendar size={12} /> Schedule
            </button>
          )}
          <button
            onClick={() => setExpanded((p) => !p)}
            className="w-8 h-8 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded answers */}
      {expanded && (
        <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100 space-y-3 pt-3">
          {Object.entries(app.answers).map(([fieldId, answer]) => (
            <div key={fieldId}>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{fieldId}</p>
              <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-line">{answer || '—'}</p>
            </div>
          ))}
          {app.notes && (
            <div className="mt-2 p-3 bg-amber-50 rounded-lg text-xs text-amber-700">
              <span className="font-semibold">Admin note:</span> {app.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Schedule interview modal (inline form) ────────────────────────────────────
const ScheduleModal: React.FC<{
  app: Application | null;
  clubId: string;
  onClose: () => void;
  onScheduled: () => void;
}> = ({ app, clubId, onClose, onScheduled }) => {
  const [scheduledAt, setScheduledAt] = useState('');
  const [durationMins, setDurationMins] = useState(30);
  const [location, setLocation] = useState('');
  const [meetLink, setMeetLink] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!app) return null;

  const handleSubmit = async () => {
    if (!scheduledAt) { toast.error('Please select a date and time.'); return; }
    setSubmitting(true);
    try {
      await scheduleInterview(clubId, {
        applicationId: app.id,
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMins,
        location: location || undefined,
        meetLink: meetLink || undefined,
      });
      toast.success('Interview scheduled! Candidate notified.');
      onScheduled();
      onClose();
    } catch {
      toast.error('Failed to schedule interview.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <Card className="w-full max-w-md space-y-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Schedule Interview</h3>
          <p className="text-sm text-gray-500 mt-0.5">Candidate: <span className="font-semibold">{app.applicantName}</span></p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Date & Time *</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Duration (minutes)</label>
            <select
              value={durationMins}
              onChange={(e) => setDurationMins(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {[15, 20, 30, 45, 60].map((d) => (
                <option key={d} value={d}>{d} minutes</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Location (optional)</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Room 204, Block B…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Google Meet / Zoom link (optional)</label>
            <input
              type="url"
              value={meetLink}
              onChange={(e) => setMeetLink(e.target.value)}
              placeholder="https://meet.google.com/…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {submitting ? 'Scheduling…' : 'Schedule'}
          </button>
        </div>
      </Card>
    </div>
  );
};

// ── Interview row ─────────────────────────────────────────────────────────────
const InterviewRow: React.FC<{
  slot: InterviewSlot;
  onResult: (id: string, result: 'accepted' | 'rejected', notes?: string) => void;
}> = ({ slot, onResult }) => {
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);

  const isPast = new Date(slot.scheduledAt) < new Date();

  return (
    <div className="border border-gray-100 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Avatar name={slot.applicantName} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{slot.applicantName}</p>
          <p className="text-xs text-gray-500">
            {new Date(slot.scheduledAt).toLocaleString('en-US', {
              weekday: 'short', month: 'short', day: 'numeric',
              hour: 'numeric', minute: '2-digit'
            })} · {slot.durationMins}min
          </p>
        </div>
        <span className={cn(
          'px-2.5 py-0.5 rounded-full text-xs font-semibold',
          slot.result === 'pending' ? 'bg-amber-100 text-amber-700' :
          slot.result === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
          'bg-red-100 text-red-600'
        )}>
          {slot.result}
        </span>
      </div>

      {(slot.location || slot.meetLink) && (
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {slot.location && <span>📍 {slot.location}</span>}
          {slot.meetLink && (
            <a href={slot.meetLink} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
              🔗 Join Meeting
            </a>
          )}
        </div>
      )}

      {slot.result === 'pending' && isPast && (
        <div className="space-y-2">
          {showNotes && (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Interview notes (optional)…"
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNotes((p) => !p)}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              {showNotes ? 'Hide notes' : 'Add notes'}
            </button>
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => onResult(slot.id, 'rejected', notes)}
                className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors flex items-center gap-1"
              >
                <XCircle size={12} /> Reject
              </button>
              <button
                onClick={() => onResult(slot.id, 'accepted', notes)}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors flex items-center gap-1"
              >
                <CheckCircle size={12} /> Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
type Tab = 'applications' | 'interviews';

const RecruitmentDashboardPage: React.FC = () => {
  const { clubId } = useParams<{ clubId: string }>();
  const [tab, setTab] = useState<Tab>('applications');
  const [applications, setApplications] = useState<Application[]>([]);
  const [interviews, setInterviews] = useState<InterviewSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [scheduleTarget, setScheduleTarget] = useState<Application | null>(null);

  const load = useCallback(async () => {
    if (!clubId) return;
    setLoading(true);
    try {
      const [apps, slots] = await Promise.all([
        fetchApplications(clubId),
        fetchInterviews(clubId),
      ]);
      setApplications(apps);
      setInterviews(slots);
    } catch {
      toast.error('Failed to load recruitment data.');
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (appId: string, status: 'shortlisted' | 'rejected') => {
    if (!clubId) return;
    setUpdating(true);
    try {
      const updated = await updateApplicationStatus(clubId, appId, status);
      setApplications((prev) => prev.map((a) => a.id === appId ? updated : a));
      toast.success(`Application ${status}.`);
    } catch {
      toast.error('Update failed.');
    } finally {
      setUpdating(false);
    }
  };

  const handleResult = async (interviewId: string, result: 'accepted' | 'rejected', notes?: string) => {
    try {
      const updated = await recordInterviewResult(interviewId, { result, notes });
      setInterviews((prev) => prev.map((s) => s.id === interviewId ? updated : s));
      toast.success(`Candidate ${result}. Email notification sent.`);
    } catch {
      toast.error('Failed to record result.');
    }
  };

  const pendingCount = applications.filter((a) => a.status === 'pending').length;
  const upcomingCount = interviews.filter((s) => s.result === 'pending').length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Recruitment Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Review applications and manage interviews</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
        {([
          { key: 'applications' as Tab, label: 'Applications', icon: <Users size={14} />, count: pendingCount },
          { key: 'interviews' as Tab, label: 'Interviews', icon: <Calendar size={14} />, count: upcomingCount },
        ]).map(({ key, label, icon, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
              tab === key
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {icon} {label}
            {count > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-indigo-400" />
        </div>
      ) : tab === 'applications' ? (
        <div className="space-y-3">
          {applications.length === 0 ? (
            <div className="text-center py-16">
              <Users size={36} className="mx-auto text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No applications yet.</p>
            </div>
          ) : (
            applications.map((app) => (
              <ApplicationRow
                key={app.id}
                app={app}
                onStatusChange={handleStatusChange}
                onSchedule={setScheduleTarget}
                updating={updating}
              />
            ))
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {interviews.length === 0 ? (
            <div className="text-center py-16">
              <Calendar size={36} className="mx-auto text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No interviews scheduled.</p>
              <p className="text-xs text-gray-400 mt-1">Shortlist applicants first, then schedule interviews.</p>
            </div>
          ) : (
            interviews.map((slot) => (
              <InterviewRow key={slot.id} slot={slot} onResult={handleResult} />
            ))
          )}
        </div>
      )}

      {/* Schedule modal */}
      {scheduleTarget && clubId && (
        <ScheduleModal
          app={scheduleTarget}
          clubId={clubId}
          onClose={() => setScheduleTarget(null)}
          onScheduled={load}
        />
      )}
    </div>
  );
};

export default RecruitmentDashboardPage;
