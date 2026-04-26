import { useState, useEffect } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import api from '../../services/api';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function PushNotificationOptIn() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
    const dismissed = localStorage.getItem('push_opt_in_dismissed');
    if (dismissed) setIsDismissed(true);
  }, []);

  const subscribe = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Push notifications are not supported in this browser.');
      return;
    }

    try {
      setIsSubscribing(true);

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // Send subscription to backend
      await api.post('/notifications/push-subscribe', {
        subscription: JSON.stringify(subscription),
      });

      setPermission('granted');
    } catch (error) {
      console.error('Push subscription failed:', error);
      if ((error as Error).name === 'NotAllowedError') {
        setPermission('denied');
      }
    } finally {
      setIsSubscribing(false);
    }
  };

  const dismiss = () => {
    localStorage.setItem('push_opt_in_dismissed', '1');
    setIsDismissed(true);
  };

  // Don't show if already granted, denied, or dismissed
  if (isDismissed || permission === 'granted' || permission === 'denied') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 rounded-xl border bg-card shadow-xl p-4 animate-in slide-in-from-bottom-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-purple-100 p-2 shrink-0">
          <Bell className="h-5 w-5 text-purple-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Stay Updated</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Get notified about events, attendance reminders, and announcements.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={subscribe}
              disabled={isSubscribing}
              className="flex-1 rounded-lg bg-purple-600 text-white text-xs font-semibold py-1.5 hover:bg-purple-700 transition-colors disabled:opacity-60"
            >
              {isSubscribing ? 'Enabling...' : 'Enable Notifications'}
            </button>
            <button
              onClick={dismiss}
              className="rounded-lg border text-xs font-semibold px-3 py-1.5 hover:bg-muted transition-colors"
            >
              Not Now
            </button>
          </div>
        </div>
        <button onClick={dismiss} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}