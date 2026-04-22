import React from 'react';
import { cn, getInitials } from '../../utils';

// ─── BADGE ──────────────────────────────────────────────────────────────────
type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'outline';

const badgeVariants: Record<BadgeVariant, string> = {
  default:  'bg-gray-100 text-gray-700',
  primary:  'bg-indigo-100 text-indigo-700',
  success:  'bg-green-100 text-green-700',
  warning:  'bg-amber-100 text-amber-700',
  danger:   'bg-red-100 text-red-700',
  info:     'bg-blue-100 text-blue-700',
  outline:  'border border-gray-300 text-gray-600',
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, className, dot }) => (
  <span className={cn(
    'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold',
    badgeVariants[variant], className
  )}>
    {dot && <span className={cn('w-1.5 h-1.5 rounded-full bg-current')} />}
    {children}
  </span>
);

// ─── AVATAR ─────────────────────────────────────────────────────────────────
interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const avatarSizes = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-lg' };

export const Avatar: React.FC<AvatarProps> = ({ src, name = '', size = 'md', className }) => (
  <div className={cn('rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center font-semibold text-indigo-700 shrink-0', avatarSizes[size], className)}>
    {src ? <img src={src} alt={name} className="w-full h-full object-cover" /> : getInitials(name)}
  </div>
);

export const AvatarGroup: React.FC<{ users: { name?: string; avatarUrl?: string }[]; max?: number }> = ({ users, max = 3 }) => (
  <div className="flex -space-x-2">
    {users.slice(0, max).map((u, i) => (
      <Avatar key={i} src={u.avatarUrl} name={u.name} size="sm" className="ring-2 ring-white" />
    ))}
    {users.length > max && (
      <div className="w-8 h-8 rounded-full bg-gray-200 ring-2 ring-white flex items-center justify-center text-xs font-semibold text-gray-600">
        +{users.length - max}
      </div>
    )}
  </div>
);

// ─── SPINNER ─────────────────────────────────────────────────────────────────
export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ size = 'md', className }) => (
  <svg className={cn('animate-spin text-indigo-600', { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }[size], className)} viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
  </svg>
);

export const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <Spinner size="lg" />
      <p className="mt-3 text-sm text-gray-500">Loading...</p>
    </div>
  </div>
);

// ─── CARD ────────────────────────────────────────────────────────────────────
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  noPad?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, noPad, ...props }) => (
  <div className={cn('bg-white rounded-2xl border border-gray-100 shadow-sm', !noPad && 'p-5', className)} {...props}>
    {children}
  </div>
);

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
export const EmptyState: React.FC<{ icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode }> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    {icon && <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mb-4">{icon}</div>}
    <h3 className="text-base font-semibold text-gray-900">{title}</h3>
    {description && <p className="mt-1 text-sm text-gray-500 max-w-xs">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
export const ProgressBar: React.FC<{ value: number; max?: number; className?: string; color?: string }> = ({ value, max = 100, className, color = 'bg-indigo-600' }) => (
  <div className={cn('w-full bg-gray-100 rounded-full h-2 overflow-hidden', className)}>
    <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${Math.min((value / max) * 100, 100)}%` }} />
  </div>
);

// ─── MODAL ────────────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const modalSizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl' };

export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, size = 'md' }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative bg-white rounded-2xl shadow-xl w-full', modalSizes[size], 'max-h-[90vh] overflow-y-auto')}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// ─── SKELETON ─────────────────────────────────────────────────────────────────
export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('bg-gray-200 rounded-xl animate-pulse', className)} />
);

export const CardSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
    <Skeleton className="h-40 w-full" />
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-3 w-1/2" />
    <div className="flex gap-2">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-3 w-16" />
    </div>
  </div>
);
