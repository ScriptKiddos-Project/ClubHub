import { useEffect, useCallback } from 'react';
import { userService } from '../services/userService';
import { useNotificationStore } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';

export const useNotifications = () => {
  const { notifications, unreadCount, setNotifications, markRead } = useNotificationStore();
  const { isAuthenticated } = useAuthStore();

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { data } = await userService.getNotifications();
      setNotifications(data.data);
    } catch { /* silent */ }
  }, [isAuthenticated, setNotifications]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkRead = useCallback(async (id: string) => {
    try {
      await userService.markNotificationRead(id);
      markRead(id);
    } catch { /* silent */ }
  }, [markRead]);

  return { notifications, unreadCount, fetchNotifications, handleMarkRead };
};
