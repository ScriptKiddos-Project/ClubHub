// pages/student/NotificationPreferencesPage.tsx
// Phase 4: Notification preferences page.
// Students opt in/out of email, push, and in-app notifications per type.

import React, { useEffect, useState } from 'react';
import { Mail, Smartphone, MessageSquare, Save, Loader2, CheckCircle } from 'lucide-react';
import { cn } from '../../utils';
import { Card } from '../../components/ui';
import { fetchNotificationPreferences, saveNotificationPreferences } from '../../services/phase4Service';
import type { NotificationPreferences } from '../../types/phase4';
import toast from 'react-hot-toast';

// ── Default prefs ─────────────────────────────────────────────────────────────
const DEFAULT_PREFS: NotificationPreferences = {
  email: {
    eventReminders: true,
    clubAnnouncements: true,
    attendanceConfirmations: true,
    recruitmentUpdates: true,
    interviewInvites: true,
  },
  push: {
    eventReminders: true,
    clubAnnouncements: false,
    attendanceConfirmations: true,
    recruitmentUpdates: true,
    interviewInvites: true,
  },
  inApp: {
    all: true,
    criticalOnly: false,
  },
};

// ── Toggle ────────────────────────────────────────────────────────────────────
const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }> = ({
  checked, onChange, disabled
}) => (
  <button
    onClick={() => !disabled && onChange(!checked)}
    disabled={disabled}
    className={cn(
      'relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0',
      checked ? 'bg-indigo-600' : 'bg-gray-200',
      disabled && 'opacity-50 cursor-not-allowed'
    )}
  >
    <span className={cn(
      'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200',
      checked ? 'translate-x-5' : 'translate-x-0'
    )} />
  </button>
);

// ── Preference row ────────────────────────────────────────────────────────────
const PrefRow: React.FC<{
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}> = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between gap-4 py-3 border-b border-gray-50 last:border-0">
    <div>
      <p className="text-sm font-medium text-gray-800">{label}</p>
      {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
    </div>
    <Toggle checked={checked} onChange={onChange} />
  </div>
);

// ── Section ───────────────────────────────────────────────────────────────────
const Section: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}> = ({ icon, title, subtitle, children }) => (
  <Card>
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
    <div>{children}</div>
  </Card>
);

// ── Main page ─────────────────────────────────────────────────────────────────
const NotificationPreferencesPage: React.FC = () => {
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchNotificationPreferences()
      .then(setPrefs)
      .catch(() => { /* use defaults */ })
      .finally(() => setLoading(false));
  }, []);

  const setEmail = <K extends keyof NotificationPreferences['email']>(key: K, val: boolean) =>
    setPrefs((p) => ({ ...p, email: { ...p.email, [key]: val } }));

  const setPush = <K extends keyof NotificationPreferences['push']>(key: K, val: boolean) =>
    setPrefs((p) => ({ ...p, push: { ...p.push, [key]: val } }));

  const setInApp = <K extends keyof NotificationPreferences['inApp']>(key: K, val: boolean) =>
    setPrefs((p) => ({ ...p, inApp: { ...p.inApp, [key]: val } }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveNotificationPreferences(prefs);
      setSaved(true);
      toast.success('Preferences saved!');
      setTimeout(() => setSaved(false), 2500);
    } catch {
      toast.error('Failed to save preferences.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notification Preferences</h1>
        <p className="text-sm text-gray-500 mt-1">
          Control how and when ClubHub notifies you.
        </p>
      </div>

      {/* Email */}
      <Section
        icon={<Mail size={18} />}
        title="Email Notifications"
        subtitle="Sent to your registered email address"
      >
        <PrefRow label="Event Reminders" description="24h before events you've registered for" checked={prefs.email.eventReminders} onChange={(v) => setEmail('eventReminders', v)} />
        <PrefRow label="Club Announcements" description="When your clubs post important updates" checked={prefs.email.clubAnnouncements} onChange={(v) => setEmail('clubAnnouncements', v)} />
        <PrefRow label="Attendance Confirmations" description="After your attendance is marked" checked={prefs.email.attendanceConfirmations} onChange={(v) => setEmail('attendanceConfirmations', v)} />
        <PrefRow label="Recruitment Updates" description="When your application status changes" checked={prefs.email.recruitmentUpdates} onChange={(v) => setEmail('recruitmentUpdates', v)} />
        <PrefRow label="Interview Invites" description="When you're scheduled for an interview" checked={prefs.email.interviewInvites} onChange={(v) => setEmail('interviewInvites', v)} />
      </Section>

      {/* Push */}
      <Section
        icon={<Smartphone size={18} />}
        title="Push Notifications"
        subtitle="Real-time alerts on this device"
      >
        <PrefRow label="Event Reminders" checked={prefs.push.eventReminders} onChange={(v) => setPush('eventReminders', v)} />
        <PrefRow label="Club Announcements" checked={prefs.push.clubAnnouncements} onChange={(v) => setPush('clubAnnouncements', v)} />
        <PrefRow label="Attendance Confirmations" checked={prefs.push.attendanceConfirmations} onChange={(v) => setPush('attendanceConfirmations', v)} />
        <PrefRow label="Recruitment Updates" checked={prefs.push.recruitmentUpdates} onChange={(v) => setPush('recruitmentUpdates', v)} />
        <PrefRow label="Interview Invites" checked={prefs.push.interviewInvites} onChange={(v) => setPush('interviewInvites', v)} />
      </Section>

      {/* In-App */}
      <Section
        icon={<MessageSquare size={18} />}
        title="In-App Notifications"
        subtitle="Shown in the notification bell"
      >
        <PrefRow
          label="Show All Notifications"
          description="Display all notifications in the bell"
          checked={prefs.inApp.all}
          onChange={(v) => setInApp('all', v)}
        />
        <PrefRow
          label="Critical Only"
          description="Only show high-priority notifications (overrides 'Show All')"
          checked={prefs.inApp.criticalOnly}
          onChange={(v) => setInApp('criticalOnly', v)}
        />
      </Section>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={cn(
          'w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200',
          saved
            ? 'bg-emerald-600 text-white'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200'
        )}
      >
        {saving ? (
          <><Loader2 size={16} className="animate-spin" /> Saving…</>
        ) : saved ? (
          <><CheckCircle size={16} /> Saved!</>
        ) : (
          <><Save size={16} /> Save Preferences</>
        )}
      </button>
    </div>
  );
};

export default NotificationPreferencesPage;
