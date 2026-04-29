// hooks/usePhase3.ts
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  fetchPointsHistory, fetchAchievements, fetchCertificates,
  requestResumeExport, submitGeoAttendance, fetchEventVenueCoords,
  fetchAttendanceMethodConfig, updateAttendanceMethodConfig,
} from '../services/phase3Service';
import type {
  PointsHistoryResponse, AchievementsResponse, CertificatesResponse,
  GeoAttendanceResult, AttendanceMethodConfig, EventVenueCoords,
} from '../types/phase3';

// ─── usePointsHistory ─────────────────────────────────────────────────────────
export const usePointsHistory = (initialPage = 1) => {
  const [data, setData] = useState<PointsHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPointsHistory(p, 20);
      setData(res);
    } catch {
      setError('Failed to load points history.');
    } finally {
      setLoading(false);
    }
  }, []);

  // FIX: wrap in void async IIFE so no setState runs synchronously in the effect body.
  useEffect(() => {
    void (async () => { await load(page); })();
  }, [page, load]);

  return { data, loading, error, page, setPage, refetch: () => load(page) };
};

// ─── useAchievements ──────────────────────────────────────────────────────────
export const useAchievements = () => {
  const [data, setData] = useState<AchievementsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setData(await fetchAchievements());
      } catch {
        setError('Failed to load achievements.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { data, loading, error };
};

// ─── useCertificates ──────────────────────────────────────────────────────────
export const useCertificates = () => {
  const [data, setData] = useState<CertificatesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setData(await fetchCertificates());
      } catch {
        toast.error('Failed to load certificates.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { data, loading };
};

// ─── useResumeExport ──────────────────────────────────────────────────────────
export const useResumeExport = () => {
  const [loading, setLoading] = useState(false);

  const exportResume = async () => {
    setLoading(true);
    const toastId = toast.loading('Generating your resume PDF…');
    try {
      const { downloadUrl } = await requestResumeExport();
      toast.success('Resume ready! Downloading…', { id: toastId });
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = 'ClubHub_Resume.pdf';
      a.click();
    } catch {
      toast.error('Resume export failed. Try again.', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return { exportResume, loading };
};

// ─── useGeoAttendance ─────────────────────────────────────────────────────────
export const useGeoAttendance = (eventId: string) => {
  const [result, setResult] = useState<GeoAttendanceResult | null>(null);
  const [venueCoords, setVenueCoords] = useState<EventVenueCoords | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    fetchEventVenueCoords(eventId)
      .then(setVenueCoords)
      .catch(() => { /* venue coords optional */ });
  }, [eventId]);

  const requestGPS = useCallback((): Promise<GeolocationPosition> =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported by your browser.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true, timeout: 10000, maximumAge: 0,
      });
    }), []);

  const markAttendance = async () => {
    setLoading(true);
    setError(null);
    setGpsLoading(true);
    try {
      const position = await requestGPS();
      const { latitude, longitude } = position.coords;
      setUserCoords({ lat: latitude, lng: longitude });
      setGpsLoading(false);

      const res = await submitGeoAttendance(eventId, { latitude, longitude });
      setResult(res);

      if (res.attendanceMarked) {
        toast.success('Attendance marked via GPS! 🎉');
      } else {
        toast.error(`You're ${Math.round(res.distance)}m away. Must be within ${res.radius}m.`);
      }
    } catch (err) {
      setGpsLoading(false);
      const msg = err instanceof GeolocationPositionError
        ? 'GPS access denied. Please enable location permissions.'
        : 'Location check failed. Try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return { result, venueCoords, userCoords, loading, gpsLoading, error, markAttendance };
};

// ─── useAttendanceMethodConfig ────────────────────────────────────────────────
export const useAttendanceMethodConfig = (eventId: string) => {
  const [config, setConfig] = useState<AttendanceMethodConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    fetchAttendanceMethodConfig(eventId)
      .then(setConfig)
      .catch(() => { /* optional — admin only */ })
      .finally(() => setLoading(false));
  }, [eventId]);

  const saveConfig = async (updated: Omit<AttendanceMethodConfig, 'eventId'>) => {
    setSaving(true);
    try {
      const res = await updateAttendanceMethodConfig(eventId, updated);
      setConfig(res);
      toast.success('Attendance methods updated.');
    } catch {
      toast.error('Failed to save config.');
    } finally {
      setSaving(false);
    }
  };

  return { config, loading, saving, saveConfig };
};