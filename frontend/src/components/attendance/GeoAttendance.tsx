// components/attendance/GeoAttendance.tsx
import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../../utils';
import { useGeoAttendance } from '../../hooks/usePhase3';

interface GeoAttendanceProps {
  eventId: string;
  alreadyAttended?: boolean;
}

function haversineMetres(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const DistanceRing: React.FC<{ distance: number; radius: number; withinFence: boolean }> = ({
  distance, radius, withinFence,
}) => {
  const pct = Math.min(distance / (radius * 1.5), 1);
  const circumference = 2 * Math.PI * 40;
  const dash = circumference * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-2 my-4">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="50" cy="50" r="40" fill="none"
          stroke={withinFence ? '#10b981' : '#f59e0b'}
          strokeWidth="8"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={circumference - dash}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
        />
        <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fontSize="22">
          {withinFence ? '✅' : '📍'}
        </text>
      </svg>
      <p className="text-sm font-semibold text-gray-700">
        {Math.round(distance)}m away · fence {radius}m
      </p>
      <p className={cn('text-xs font-medium', withinFence ? 'text-emerald-600' : 'text-amber-600')}>
        {withinFence ? 'Within attendance zone' : 'Outside attendance zone'}
      </p>
    </div>
  );
};

// FIX: initialise `watching` as false. Flip it inside the geolocation
// success/error callbacks (which are async) rather than synchronously
// at the top of the effect body — this avoids the lint violation.
const useLiveDistance = (
  venueLat?: number,
  venueLng?: number,
): { distance: number | null; watching: boolean } => {
  const [distance, setDistance] = useState<number | null>(null);
  const [watching, setWatching] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!venueLat || !venueLng || !navigator.geolocation) return;

    // Start watching — mark as active once the first position arrives
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setWatching(true);
        setDistance(
          haversineMetres(pos.coords.latitude, pos.coords.longitude, venueLat, venueLng),
        );
      },
      () => setWatching(false),
      { enableHighAccuracy: true, maximumAge: 3000 },
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      setWatching(false);
    };
  }, [venueLat, venueLng]);

  return { distance, watching };
};

const GeoAttendance: React.FC<GeoAttendanceProps> = ({ eventId, alreadyAttended = false }) => {
  const { result, venueCoords, loading, gpsLoading, error, markAttendance } = useGeoAttendance(eventId);
  const { distance: liveDistance, watching } = useLiveDistance(
    venueCoords?.latitude,
    venueCoords?.longitude,
  );

  const success = result?.attendanceMarked;
  const failure = result && !result.attendanceMarked;

  if (alreadyAttended && !result) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium">
        <CheckCircle size={16} />
        Attendance already marked
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
          <MapPin size={20} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">GPS Attendance</h3>
          <p className="text-xs text-gray-500">Must be physically present at the venue</p>
        </div>
      </div>

      {venueCoords && liveDistance !== null && !success && (
        <DistanceRing
          distance={liveDistance}
          radius={venueCoords.geoFenceRadius}
          withinFence={liveDistance <= venueCoords.geoFenceRadius}
        />
      )}

      {watching && liveDistance !== null && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          Live GPS tracking active
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
          <CheckCircle size={18} className="text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">Attendance Marked!</p>
            <p className="text-xs text-emerald-600">You were {Math.round(result.distance)}m from venue</p>
          </div>
        </div>
      )}

      {failure && (
        <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <XCircle size={18} className="text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Outside Zone</p>
            <p className="text-xs text-amber-600">
              You're {Math.round(result.distance)}m away — must be within {result.radius}m
            </p>
          </div>
        </div>
      )}

      {error && !result && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {!success && (
        <button
          onClick={markAttendance}
          disabled={loading || alreadyAttended}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200',
            loading
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white shadow-sm shadow-blue-200',
          )}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {gpsLoading ? 'Getting your location…' : 'Checking distance…'}
            </>
          ) : (
            <>
              <Navigation size={16} />
              Mark Attendance via GPS
            </>
          )}
        </button>
      )}

      {failure && (
        <button
          onClick={markAttendance}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default GeoAttendance;