import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatDate = (date: string) => format(parseISO(date), 'MMM d, yyyy');
export const formatTime = (time: string) => {
  const [h, m] = time.split(':');
  const hour = parseInt(h);
  return `${hour > 12 ? hour - 12 : hour}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
};
export const formatRelative = (date: string) => formatDistanceToNow(parseISO(date), { addSuffix: true });
export const formatDateTime = (date: string) => format(parseISO(date), 'MMM d, yyyy • h:mm a');

export const spotsLeft = (capacity: number, registered: number) => capacity - registered;
export const spotsColor = (capacity: number, registered: number) => {
  const pct = (registered / capacity) * 100;
  if (pct >= 90) return 'text-red-500';
  if (pct >= 70) return 'text-amber-500';
  return 'text-green-500';
};

export const categoryColor = (category: string): string => {
  const map: Record<string, string> = {
    technology: 'bg-blue-100 text-blue-700',
    arts_culture: 'bg-purple-100 text-purple-700',
    sports: 'bg-green-100 text-green-700',
    academic: 'bg-yellow-100 text-yellow-700',
    social: 'bg-pink-100 text-pink-700',
    career_prep: 'bg-orange-100 text-orange-700',
    development: 'bg-cyan-100 text-cyan-700',
    creative_arts: 'bg-rose-100 text-rose-700',
  };
  return map[category] ?? 'bg-gray-100 text-gray-700';
};

export const roleLabel: Record<string, string> = {
  student: 'Student',
  member: 'Member',
  secretary: 'Secretary',
  event_manager: 'Event Manager',
  super_admin: 'Super Admin',
};

export const getInitials = (name: string) =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

export const truncate = (str: string, n: number) =>
  str.length > n ? str.slice(0, n - 1) + '...' : str;
