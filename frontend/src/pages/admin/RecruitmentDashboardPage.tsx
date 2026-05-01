// pages/admin/RecruitmentDashboardPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users, Calendar, CheckCircle, XCircle, Loader2,
  ChevronDown, ChevronUp, Send, ArrowLeft, Mail,
  Settings, Plus, Trash2, ToggleLeft, ToggleRight, GripVertical,
  ClipboardList,
} from 'lucide-react';
import { cn } from '../../utils';
import { Card, Avatar } from '../../components/ui';
import {
  fetchApplications, updateApplicationStatus,
  fetchInterviews, scheduleInterview, recordInterviewResult,
  fetchRecruitmentForm, upsertRecruitmentForm,
} from '../../services/phase4Service';
import type {
  Application, InterviewSlot, ApplicationStatus,
  RecruitmentForm, ApplicationField,
} from '../../types/phase4';
import { useClubs } from '../../hooks/useClubs';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

// ── helpers ───────────────────────────────────────────────────────────────────

const safeDate = (raw: string | undefined | null, opts?: Intl.DateTimeFormatOptions): string => {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', opts ?? { month: 'short', day: 'numeric' });
};

const safeDatetime = (raw: string | undefined | null): string => {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getSubmittedAt = (app: any): string =>
  app.submittedAt ?? app.createdAt ?? app.created_at ?? '';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getAnswers = (app: any): Record<string, string> => {
  const raw = app.answers ?? app.formData ?? app.form_data;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  return raw as Record<string, string>;
};

const generateFieldId = () => `field_${Math.random().toString(36).slice(2, 8)}`;

// ── Club Picker ───────────────────────────────────────────────────────────────

const ClubPickerPage: React.FC = () => {
  const navigate = useNavigate();
  const { clubs, loading } = useClubs();
  const { user } = useAuthStore();

  const managedClubs = user?.role === 'super_admin'
    ? clubs
    : clubs.filter((c) => c.isJoined);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Recruitment Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Select a club to manage recruitment for.</p>
      </div>

      <div className="space-y-3">
        {managedClubs.length === 0 ? (
          <div className="text-center py-16">
            <Users size={36} className="mx-auto text-gray-200 mb-2" />
            <p className="text-sm text-gray-400">No clubs found.</p>
            <p className="text-xs text-gray-400 mt-1">You must be a member of a club to manage its recruitment.</p>
          </div>
        ) : (
          managedClubs.map((club) => (
            <button
              key={club.id}
              onClick={() => navigate(`/admin/clubs/${club.id}/recruitment`)}
              className="w-full flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:border-indigo-200 hover:bg-indigo-50 transition-all text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg shrink-0 overflow-hidden">
                {club.logoUrl
                  ? <img src={club.logoUrl} alt={club.name} className="w-full h-full object-cover" />
                  : club.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{club.name}</p>
                <p className="text-xs text-gray-500">{club.memberCount} members · {club.category}</p>
              </div>
              <ClipboardList size={16} className="text-indigo-400 shrink-0" />
            </button>
          ))
        )}
      </div>
    </div>
  );
};

// ── sub-components ────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  pending:     'bg-gray-100 text-gray-600',
  shortlisted: 'bg-blue-100 text-blue-700',
  rejected:    'bg-red-100 text-red-600',
  accepted:    'bg-emerald-100 text-emerald-700',
};

const StatusBadge: React.FC<{ status: ApplicationStatus }> = ({ status }) => (
  <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize', STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600')}>
    {status}
  </span>
);

// FIX 2: Added formFields prop to resolve field IDs → human labels in responses
const ApplicationRow: React.FC<{
  app: Application;
  formFields: ApplicationField[];
  onStatusChange: (id: string, status: 'shortlisted' | 'rejected') => void;
  onSchedule: (app: Application) => void;
  updating: boolean;
}> = ({ app, formFields, onStatusChange, onSchedule, updating }) => {
  const [expanded, setExpanded] = useState(false);
  const answers = getAnswers(app);
  const hasAnswers = Object.keys(answers).length > 0;

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <Avatar name={app.applicantName ?? '?'} size="sm" className="shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{app.applicantName ?? '—'}</p>
          <p className="text-xs text-gray-500">
            {app.applicantEmail ?? '—'}
            {app.applicantDept ? ` · ${app.applicantDept}` : ''}
          </p>
        </div>
        <StatusBadge status={app.status} />
        <p className="text-[11px] text-gray-400 shrink-0 hidden sm:block">
          {safeDate(getSubmittedAt(app))}
        </p>
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
              <Calendar size={12} /> Schedule Interview
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

      {expanded && (
        <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100 pt-3 space-y-3">
          {hasAnswers ? (
            // FIX 2: Resolve field ID → human label using formFields
            Object.entries(answers).map(([fieldId, answer]) => {
              const fieldDef = formFields.find((f) => f.id === fieldId);
              const label = fieldDef?.label || fieldId.replace(/^field_/, '').replace(/_/g, ' ');
              return (
                <div key={fieldId}>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                    {label}
                  </p>
                  <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-line">
                    {String(answer) || '—'}
                  </p>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-gray-400 italic">No form answers recorded.</p>
          )}
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

// ── Schedule modal ────────────────────────────────────────────────────────────

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
        candidateId:   app.applicantId,
        scheduledAt:   new Date(scheduledAt).toISOString(),
        durationMins,
        location:      location || undefined,
        meetLink:      meetLink || undefined,
      });
      toast.success('Interview scheduled! Calendar invite (.ics) emailed to candidate.');
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
          <p className="text-sm text-gray-500 mt-0.5">
            Candidate: <span className="font-semibold">{app.applicantName}</span>
          </p>
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
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Duration (minutes)</label>
            <select
              value={durationMins}
              onChange={(e) => setDurationMins(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {[15, 20, 30, 45, 60].map((d) => <option key={d} value={d}>{d} minutes</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-start gap-2 px-3 py-2.5 bg-indigo-50 rounded-xl text-xs text-indigo-700">
          <Mail size={13} className="mt-0.5 shrink-0" />
          <span>
            A calendar invite (.ics) will be automatically emailed to{' '}
            <strong>{app.applicantEmail}</strong>.
          </span>
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
            {submitting ? 'Scheduling…' : 'Schedule & Notify'}
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
  const isPast = slot.scheduledAt ? new Date(slot.scheduledAt) < new Date() : false;

  return (
    <div className="border border-gray-100 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Avatar name={slot.applicantName ?? '?'} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{slot.applicantName ?? '—'}</p>
          <p className="text-xs text-gray-500">
            {safeDatetime(slot.scheduledAt)} · {slot.durationMins ?? '?'}min
          </p>
        </div>
        <span className={cn(
          'px-2.5 py-0.5 rounded-full text-xs font-semibold',
          slot.result === 'pending'  ? 'bg-amber-100 text-amber-700'    :
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
            <button onClick={() => setShowNotes((p) => !p)} className="text-xs text-gray-500 hover:text-gray-700 underline">
              {showNotes ? 'Hide notes' : 'Add notes'}
            </button>
            <span className="text-[10px] text-gray-400 flex items-center gap-1 ml-1">
              <Mail size={10} /> Result email auto-sent to candidate
            </span>
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

      {slot.result === 'pending' && !isPast && (
        <p className="text-[11px] text-gray-400">
          Interview not yet complete — result actions appear after the scheduled time.
        </p>
      )}

      {(slot.result === 'accepted' || slot.result === 'rejected') && (
        <p className="text-[11px] text-gray-400 flex items-center gap-1">
          <Mail size={10} /> Notification email sent to candidate
        </p>
      )}
    </div>
  );
};

// ── Form Settings Tab ─────────────────────────────────────────────────────────

const EMPTY_FIELD = (): ApplicationField => ({
  id: generateFieldId(),
  label: '',
  type: 'text',
  required: false,
  options: [],
});

const FormSettingsTab: React.FC<{ clubId: string }> = ({ clubId }) => {
  const [form, setForm] = useState<RecruitmentForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [deadline, setDeadline] = useState('');
  const [fields, setFields] = useState<ApplicationField[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchRecruitmentForm(clubId).then((data) => {
      if (cancelled) return;
      setLoading(false);
      if (data) {
        setForm(data);
        setTitle(data.title ?? '');
        setDescription(data.description ?? '');
        setIsOpen(data.isOpen ?? false);
        setDeadline(
          data.deadline
            ? new Date(data.deadline).toISOString().slice(0, 16)
            : ''
        );
        setFields(data.fields?.length ? data.fields : [EMPTY_FIELD()]);
      } else {
        setFields([EMPTY_FIELD()]);
      }
    });
    return () => { cancelled = true; };
  }, [clubId]);

  const addField = () => setFields((prev) => [...prev, EMPTY_FIELD()]);

  const removeField = (id: string) =>
    setFields((prev) => prev.filter((f) => f.id !== id));

  const updateField = (id: string, patch: Partial<ApplicationField>) =>
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const handleSave = async () => {
    if (!title.trim()) { toast.error('Please enter a form title.'); return; }
    if (fields.some((f) => !f.label.trim())) {
      toast.error('All fields must have a label.'); return;
    }
    setSaving(true);
    try {
      const saved = await upsertRecruitmentForm(clubId, {
        title,
        description,
        isOpen,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        fields,
      });
      setForm(saved);
      toast.success(
        isOpen
          ? '✅ Recruitment is now OPEN — students can apply.'
          : '✅ Form saved. Recruitment is currently closed.'
      );
    } catch {
      toast.error('Failed to save form.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={22} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Open/Close status banner */}
      <div className={cn(
        'flex items-center justify-between px-4 py-3 rounded-xl border',
        isOpen ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'
      )}>
        <div>
          <p className={cn('text-sm font-semibold', isOpen ? 'text-emerald-700' : 'text-gray-600')}>
            {isOpen ? '🟢 Recruitment is OPEN' : '⚫ Recruitment is CLOSED'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {isOpen
              ? 'Students can currently see and submit the application form.'
              : 'Students see "No open recruitment". Toggle open and save to enable.'}
          </p>
        </div>
        <button
          onClick={() => setIsOpen((p) => !p)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors',
            isOpen
              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          )}
        >
          {isOpen
            ? <><ToggleRight size={16} /> Close Recruitment</>
            : <><ToggleLeft size={16} /> Open Recruitment</>}
        </button>
      </div>

      {/* Form metadata */}
      <Card className="space-y-4 p-5">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Form Details</h3>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Form Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Core Team Application 2025"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Description (shown to applicants)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell applicants what you're looking for…"
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Application Deadline (optional)</label>
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </Card>

      {/* Field builder */}
      <Card className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
            Form Fields ({fields.length})
          </h3>
          <button
            onClick={addField}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-semibold transition-colors"
          >
            <Plus size={13} /> Add Field
          </button>
        </div>

        <div className="space-y-3">
          {fields.map((field, idx) => (
            <div key={field.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50 space-y-3">
              <div className="flex items-center gap-2">
                <GripVertical size={14} className="text-gray-300 shrink-0" />
                {/* FIX 1: Show the field's label live in the header; fall back to index only when empty */}
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide truncate flex-1">
                  {field.label.trim() ? field.label : `Field ${idx + 1}`}
                </span>
                <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none shrink-0">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(field.id, { required: e.target.checked })}
                    className="rounded"
                  />
                  Required
                </label>
                <button
                  onClick={() => removeField(field.id)}
                  disabled={fields.length === 1}
                  className="w-7 h-7 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center transition-colors disabled:opacity-30 shrink-0"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Label *</label>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => updateField(field.id, { label: e.target.value })}
                    placeholder="e.g. Why do you want to join?"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Type</label>
                  <select
                    value={field.type}
                    onChange={(e) =>
                      updateField(field.id, {
                        type: e.target.value as ApplicationField['type'],
                        options: e.target.value === 'select' ? [''] : [],
                      })
                    }
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                  >
                    <option value="text">Short Text</option>
                    <option value="textarea">Long Text</option>
                    <option value="select">Dropdown</option>
                  </select>
                </div>
              </div>

              {field.type === 'select' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Options (one per line)</label>
                  <textarea
                    value={(field.options ?? []).join('\n')}
                    onChange={(e) =>
                      updateField(field.id, { options: e.target.value.split('\n') })
                    }
                    placeholder={"Option A\nOption B\nOption C"}
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
          {saving ? 'Saving…' : form ? 'Save Changes' : 'Create & Publish Form'}
        </button>
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

type Tab = 'applications' | 'interviews' | 'form';

const RecruitmentDashboardPage: React.FC = () => {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();

  if (!clubId) return <ClubPickerPage />;

  return <RecruitmentDashboardInner clubId={clubId} navigate={navigate} />;
};

// Split into inner component so hooks aren't called conditionally
const RecruitmentDashboardInner: React.FC<{
  clubId: string;
  navigate: ReturnType<typeof useNavigate>;
}> = ({ clubId, navigate }) => {
  const [tab, setTab] = useState<Tab>('form');
  const [applications, setApplications] = useState<Application[]>([]);
  const [interviews, setInterviews] = useState<InterviewSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [scheduleTarget, setScheduleTarget] = useState<Application | null>(null);
  // FIX 2: Store form fields so application responses can resolve IDs → labels
  const [formFields, setFormFields] = useState<ApplicationField[]>([]);

  // FIX 2: Fetch form alongside applications so field labels are always available
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [apps, slots, form] = await Promise.all([
        fetchApplications(clubId),
        fetchInterviews(clubId),
        fetchRecruitmentForm(clubId),
      ]);
      setApplications(Array.isArray(apps) ? apps : []);
      setInterviews(Array.isArray(slots) ? slots : []);
      setFormFields(form?.fields ?? []);
    } catch {
      toast.error('Failed to load recruitment data.');
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (appId: string, status: 'shortlisted' | 'rejected') => {
    setUpdating(true);
    try {
      const updated = await updateApplicationStatus(clubId, appId, status);
      setApplications((prev) => prev.map((a) => (a.id === appId ? updated : a)));
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
      setInterviews((prev) => prev.map((s) => (s.id === interviewId ? updated : s)));
      toast.success(`Candidate ${result}. Email notification sent automatically.`);
    } catch {
      toast.error('Failed to record result.');
    }
  };

  const pendingCount  = applications.filter((a) => a.status === 'pending').length;
  const upcomingCount = interviews.filter((s) => s.result === 'pending').length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      <button
        onClick={() => navigate('/admin/recruitment')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={15} /> Back to Club Selection
      </button>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Recruitment Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Set up your application form, review submissions, and manage interviews.
        </p>
      </div>

      {/* Workflow hint */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-2.5">
        <span className="font-semibold text-gray-500">Workflow:</span>
        <span className="px-2 py-0.5 rounded-md bg-violet-100 text-violet-600">0. Create Form & Open</span>
        <span>→</span>
        <span className="px-2 py-0.5 rounded-md bg-gray-200 text-gray-600">1. Review</span>
        <span>→</span>
        <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-600">2. Shortlist</span>
        <span>→</span>
        <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-600">3. Schedule</span>
        <span>→</span>
        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-600">4. Record result</span>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
        {([
          { key: 'form'         as Tab, label: 'Form & Settings', icon: <Settings size={14} />,  count: 0 },
          { key: 'applications' as Tab, label: 'Applications',    icon: <Users size={14} />,     count: pendingCount },
          { key: 'interviews'   as Tab, label: 'Interviews',      icon: <Calendar size={14} />,  count: upcomingCount },
        ]).map(({ key, label, icon, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
              tab === key ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700',
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

      {/* Tab content */}
      {tab === 'form' && (
        <FormSettingsTab clubId={clubId} />
      )}

      {tab !== 'form' && loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-indigo-400" />
        </div>
      )}

      {tab === 'applications' && !loading && (
        <div className="space-y-3">
          {applications.length === 0 ? (
            <div className="text-center py-16">
              <Users size={36} className="mx-auto text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No applications yet.</p>
              <p className="text-xs text-gray-400 mt-1">
                Make sure recruitment is open in the Form &amp; Settings tab.
              </p>
            </div>
          ) : (
            // FIX 2: Pass formFields so responses show human labels not raw IDs
            applications.map((app) => (
              <ApplicationRow
                key={app.id}
                app={app}
                formFields={formFields}
                onStatusChange={handleStatusChange}
                onSchedule={setScheduleTarget}
                updating={updating}
              />
            ))
          )}
        </div>
      )}

      {tab === 'interviews' && !loading && (
        <div className="space-y-3">
          {interviews.length === 0 ? (
            <div className="text-center py-16">
              <Calendar size={36} className="mx-auto text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No interviews scheduled yet.</p>
              <p className="text-xs text-gray-400 mt-1">
                Shortlist an applicant first, then click "Schedule Interview".
              </p>
            </div>
          ) : (
            interviews.map((slot) => (
              <InterviewRow key={slot.id} slot={slot} onResult={handleResult} />
            ))
          )}
        </div>
      )}

      {scheduleTarget && (
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