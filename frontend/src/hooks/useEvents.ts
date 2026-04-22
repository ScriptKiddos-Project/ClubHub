import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { eventService } from '../services/eventService';
import type { Event } from '../types';

interface UseEventsOptions {
  clubId?: string;
  type?: string;
  search?: string;
  autoFetch?: boolean;
}

export const useEvents = (options: UseEventsOptions = {}) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchEvents = useCallback(async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await eventService.list({
        page: p, limit: 12,
        clubId: options.clubId,
        type: options.type,
        search: options.search,
      });
      if (p === 1) setEvents(data.data);
      else setEvents((prev) => [...prev, ...data.data]);
      setTotalPages(data.pagination.totalPages);
      setPage(p);
    } catch {
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [options.clubId, options.type, options.search]);

  useEffect(() => {
    if (options.autoFetch !== false) fetchEvents(1); // eslint-disable-line react-hooks/set-state-in-effect
  }, [fetchEvents, options.autoFetch]);

  const loadMore = () => { if (page < totalPages) fetchEvents(page + 1); };

  const registerForEvent = useCallback(async (id: string) => {
    try {
      await eventService.register(id);
      setEvents((prev) => prev.map((e) =>
        e.id === id ? { ...e, isRegistered: true, registrationCount: e.registrationCount + 1 } : e
      ));
      toast.success('Successfully registered! Check your email for confirmation.');
    } catch {
      toast.error('Failed to register. Event may be full.');
    }
  }, []);

  const unregisterFromEvent = useCallback(async (id: string) => {
    try {
      await eventService.unregister(id);
      setEvents((prev) => prev.map((e) =>
        e.id === id ? { ...e, isRegistered: false, registrationCount: e.registrationCount - 1 } : e
      ));
      toast.success('Unregistered from event');
    } catch {
      toast.error('Failed to unregister');
    }
  }, []);

  return { events, loading, error, page, totalPages, loadMore, fetchEvents, registerForEvent, unregisterFromEvent };
};

export const useEvent = (id: string) => {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true); // eslint-disable-line react-hooks/set-state-in-effect
    eventService.get(id)
      .then(({ data }) => setEvent(data.data))
      .catch(() => setError('Failed to load event'))
      .finally(() => setLoading(false));
  }, [id]);

  return { event, loading, error };
};
