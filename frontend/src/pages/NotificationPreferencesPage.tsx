import { useEffect, useState } from 'react';
import api from '../../services/api';

const NOTIFICATION_TYPES = [
  { key: 'event_reminder', label: 'Event Reminders' },
  { key: 'attendance_confirmed', label: 'Attendance Confirmed' },
  { key: 'points_awarded', label: 'Points Awarded' },
  { key: 'announcement', label: 'Club Announcements' },
  { key: 'application_update', label: 'Application Updates' },
  { key: 'interview_scheduled', label: 'Interview Scheduled' },
];

export const NotificationPreferencesPage = () => {
  const [prefs, setPrefs] = useState({
    emailEnabled: true,
    pushEnabled: true,
    types: NOTIFICATION_TYPES.map((t) => t.key),
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/notifications/preferences').then((res) => {
      if (res.data.data) setPrefs(res.data.data);
    });
  }, []);

  const toggleType = (key: string) => {
    setPrefs((prev) => ({
      ...prev,
      types: prev.types.includes(key)
        ? prev.types.filter((t) => t !== key)
        : [...prev.types, key],
    }));
  };

  const save = async () => {
    await api.put('/notifications/preferences', prefs);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-lg mx-auto p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Notification Preferences</h2>

      <div className="bg-white rounded-xl border p-5 space-y-5">
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
            Channels
          </h3>
          {[
            { key: 'emailEnabled', label: '📧 Email Notifications' },
            { key: 'pushEnabled', label: '🔔 Push Notifications' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-gray-700">{label}</span>
              <div
                onClick={() => setPrefs((p) => ({ ...p, [key]: !p[key as keyof typeof p] }))}
                className={`relative w-10 h-6 rounded-full transition-colors ${
                  prefs[key as 'emailEnabled' | 'pushEnabled'] ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    prefs[key as 'emailEnabled' | 'pushEnabled'] ? 'translate-x-4' : ''
                  }`}
                />
              </div>
            </label>
          ))}
        </div>

        <div className="border-t pt-5 space-y-3">
          <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
            Notification Types
          </h3>
          {NOTIFICATION_TYPES.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.types.includes(key)}
                onChange={() => toggleType(key)}
                className="w-4 h-4 rounded accent-blue-600"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>

        <button
          onClick={save}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          {saved ? '✅ Saved!' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
};