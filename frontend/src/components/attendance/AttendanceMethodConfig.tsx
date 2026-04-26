// components/attendance/AttendanceMethodConfig.tsx
// Admin (Secretary / Event Manager) panel to configure which attendance
// methods are active for a specific event.

import React, { useEffect, useState } from 'react';
import { QrCode, MapPin, Hash, ClipboardList, Save, Loader2 } from 'lucide-react';
import { cn } from '../../utils';
import { useAttendanceMethodConfig } from '../../hooks/usePhase3';
import type { AttendanceMethodConfig as Config } from '../../types/phase3';

interface ToggleRowProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  badge?: string;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ icon, label, description, checked, onChange, badge }) => (
  <label className={cn(
    'flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-150 select-none',
    checked
      ? 'border-indigo-200 bg-indigo-50'
      : 'border-gray-100 bg-white hover:border-gray-200'
  )}>
    <div className={cn(
      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg',
      checked ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'
    )}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-900">{label}</span>
        {badge && (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
            {badge}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-0.5">{description}</p>
    </div>
    {/* Toggle switch */}
    <div
      onClick={(e) => { e.preventDefault(); onChange(!checked); }}
      className={cn(
        'relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0',
        checked ? 'bg-indigo-600' : 'bg-gray-200'
      )}
    >
      <span className={cn(
        'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200',
        checked ? 'translate-x-5' : 'translate-x-0'
      )} />
    </div>
  </label>
);

interface Props {
  eventId: string;
}

const AttendanceMethodConfigPanel: React.FC<Props> = ({ eventId }) => {
  const { config, loading, saving, saveConfig } = useAttendanceMethodConfig(eventId);
  const [local, setLocal] = useState<Omit<Config, 'eventId'> | null>(null);

  useEffect(() => {
    if (config) {
      setLocal({
        qrEnabled: config.qrEnabled,
        geoEnabled: config.geoEnabled,
        pinEnabled: config.pinEnabled,
        manualEnabled: config.manualEnabled,
      });
    }
  }, [config]);

  const set = (key: keyof Omit<Config, 'eventId'>, val: boolean) =>
    setLocal((prev) => prev ? { ...prev, [key]: val } : prev);

  const isDirty = local && config && (
    local.qrEnabled !== config.qrEnabled ||
    local.geoEnabled !== config.geoEnabled ||
    local.pinEnabled !== config.pinEnabled ||
    local.manualEnabled !== config.manualEnabled
  );

  if (loading || !local) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-400">
        <Loader2 size={18} className="animate-spin mr-2" />
        Loading config…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Attendance Methods</h3>
          <p className="text-xs text-gray-500">Fallback order: QR → GPS → PIN → Manual</p>
        </div>
      </div>

      <ToggleRow
        icon={<QrCode size={18} />}
        label="QR Code"
        description="Students scan a time-limited QR code displayed on screen"
        checked={local.qrEnabled}
        onChange={(v) => set('qrEnabled', v)}
        badge="Recommended"
      />
      <ToggleRow
        icon={<MapPin size={18} />}
        label="GPS Geo-fence"
        description="Students must be within the configured radius of the venue"
        checked={local.geoEnabled}
        onChange={(v) => set('geoEnabled', v)}
      />
      <ToggleRow
        icon={<Hash size={18} />}
        label="PIN Code"
        description="Students enter a 4–6 digit PIN; auto-expires at event end"
        checked={local.pinEnabled}
        onChange={(v) => set('pinEnabled', v)}
      />
      <ToggleRow
        icon={<ClipboardList size={18} />}
        label="Manual Override"
        description="Secretary manually marks attendance from the roster"
        checked={local.manualEnabled}
        onChange={(v) => set('manualEnabled', v)}
      />

      {isDirty && (
        <button
          onClick={() => local && saveConfig(local)}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors mt-2"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      )}
    </div>
  );
};

export default AttendanceMethodConfigPanel;
