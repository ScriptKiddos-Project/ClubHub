import { useState } from 'react';
import { Bell, X } from 'lucide-react';
import api from '../../services/api';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}

export function PushNotificationOptIn() {
  const [permission, setPermission] = useState<NotificationPermission>(
    () => ('Notification' in window ? Notification.permission : 'default')
  );
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isDismissed, setIsDismissed] = useState(
    () => !!localStorage.getItem('push_opt_in_dismissed')
  );

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
      await api.post('/notifications/push-subscribe', {
        subscription: JSON.stringify(subscription),
      });
      setPermission('granted');
    } catch (error) {
      if ((error as Error).name === 'NotAllowedError') setPermission('denied');
    } finally {
      setIsSubscribing(false);
    }
  };

  const dismiss = () => {
    localStorage.setItem('push_opt_in_dismissed', '1');
    setIsDismissed(true);
  };

  if (isDismissed || permission === 'granted' || permission === 'denied') return null;

  return (
    <div className="rounded-2xl border border-purple-100 bg-white p-4 flex items-center gap-4 shadow-sm">
      <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
        <Bell className="h-5 w-5 text-purple-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">Enable Notifications</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Get notified about events, attendance, and announcements.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={subscribe}
          disabled={isSubscribing}
          className="px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-colors disabled:opacity-60"
        >
          {isSubscribing ? 'Enabling…' : 'Enable'}
        </button>
        <button onClick={dismiss} className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors">
          <X className="h-4 w-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
}