import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { clubService } from '../services/clubService';
import type { Club } from '../types';

export const useClubs = (autoFetch = true) => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClubs = useCallback(async (category?: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await clubService.list({ page: 1, limit: 50, category });
      setClubs(data.data);
    } catch {
      setError('Failed to load clubs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) fetchClubs();
  }, [autoFetch, fetchClubs]);

  const joinClub = useCallback(async (id: string) => {
    try {
      await clubService.join(id);
      setClubs((prev) => prev.map((c) =>
        c.id === id ? { ...c, isJoined: true, memberCount: c.memberCount + 1 } : c
      ));
      toast.success('Successfully joined club!');
    } catch {
      toast.error('Failed to join club');
    }
  }, []);

  const leaveClub = useCallback(async (id: string) => {
    try {
      await clubService.leave(id);
      setClubs((prev) => prev.map((c) =>
        c.id === id ? { ...c, isJoined: false, memberCount: c.memberCount - 1 } : c
      ));
      toast.success('Left club');
    } catch {
      toast.error('Failed to leave club');
    }
  }, []);

  return { clubs, loading, error, fetchClubs, joinClub, leaveClub };
};

export const useClub = (id: string) => {
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    clubService.get(id)
      .then(({ data }) => setClub(data.data))
      .catch(() => setError('Failed to load club'))
      .finally(() => setLoading(false));
  }, [id]);

  return { club, loading, error };
};
