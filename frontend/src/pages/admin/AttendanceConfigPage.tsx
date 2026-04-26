// pages/admin/AttendanceConfigPage.tsx
// Event Manager / Secretary page to configure which attendance methods
// are active per event, and view the event's attendance method fallback order.

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, Info } from 'lucide-react';
import { Card } from '../../components/ui';
import AttendanceMethodConfigPanel from '../../components/attendance/AttendanceMethodConfig';

const FALLBACK_STEPS = [
  { step: 1, label: 'QR Code', detail: 'Highest accuracy – HMAC-signed, time-windowed', icon: '📱' },
  { step: 2, label: 'GPS Geo-fence', detail: 'Haversine distance; configurable radius per event', icon: '📍' },
  { step: 3, label: 'PIN Code', detail: '4–6 digit PIN hashed in Redis; auto-expires at event end', icon: '🔢' },
  { step: 4, label: 'Manual Override', detail: 'Secretary marks attendance from roster; full audit log', icon: '✏️' },
];

const AttendanceConfigPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  if (!eventId) {
    return <p className="text-center text-red-500 py-20 text-sm">Missing event ID.</p>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Attendance Configuration</h1>
          <p className="text-xs text-gray-400">Event ID: {eventId}</p>
        </div>
      </div>

      {/* Method config panel */}
      <Card>
        <div className="flex items-center gap-2 mb-5">
          <Settings size={16} className="text-indigo-500" />
          <span className="text-sm font-bold text-gray-900">Enable / Disable Methods</span>
        </div>
        <AttendanceMethodConfigPanel eventId={eventId} />
      </Card>

      {/* Fallback order info card */}
      <Card className="bg-blue-50 border-blue-100">
        <div className="flex items-start gap-2 mb-4">
          <Info size={15} className="text-blue-500 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-700 font-medium">
            When multiple methods are enabled, the system uses this fallback order.
            Students will use the first available method.
          </p>
        </div>
        <div className="space-y-3">
          {FALLBACK_STEPS.map((s) => (
            <div key={s.step} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                {s.step}
              </div>
              <span className="text-sm mr-1">{s.icon}</span>
              <div>
                <p className="text-xs font-semibold text-gray-800">{s.label}</p>
                <p className="text-[11px] text-gray-500">{s.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default AttendanceConfigPage;
