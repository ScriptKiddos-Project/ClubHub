import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';
import api from '../../services/api';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const priorityColors: Record<string, string> = {
  critical: 'border-l-4 border-red-500',
  standard: 'border-l-4 border-blue-500',
  low: 'border-l-4 border-gray-300',
};

export const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const socketRef = useSocket('/notifications');

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    api.get('/notifications').then((res) => setNotifications(res.data.data));
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.on('notification', (notif: Notification) => {
      setNotifications((prev) => [notif, ...prev]);
    });

    socket.on('announcement', (data: { title: string; body: string }) => {
      const syntheticNotif: Notification = {
        id: Date.now().toString(),
        title: `📢 ${data.title}`,
        body: data.body,
        type: 'announcement',
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      setNotifications((prev) => [syntheticNotif, ...prev]);
    });

    return () => {
      socket.off('notification');
      socket.off('announcement');
    };
  }, [socketRef.current]);

  const markRead = async (id: string) => {
    await api.put(`/notifications/${id}/read`);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllRead = async () => {
    await Promise.all(
      notifications.filter((n) => !n.isRead).map((n) => api.put(`/notifications/${n.id}/read`))
    );
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-full hover:bg-gray-100"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h4 className="font-semibold text-sm text-gray-800">Notifications</h4>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-blue-600 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y">
            {notifications.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">No notifications</p>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markRead(notif.id)}
                  className={`px-4 py-3 cursor-pointer hover:bg-gray-50 ${
                    !notif.isRead ? 'bg-blue-50' : ''
                  } ${priorityColors[notif.type] || ''}`}
                >
                  <p className="text-sm font-medium text-gray-800">{notif.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.body}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notif.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};