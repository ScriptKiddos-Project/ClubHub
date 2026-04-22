import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, CheckCircle, Key } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useClubs } from '../../hooks/useClubs';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────
const forgotSchema = z.object({ email: z.string().email('Enter a valid email') });
type ForgotData = z.infer<typeof forgotSchema>;

export const ForgotPasswordPage: React.FC = () => {
  const { handleForgotPassword } = useAuth();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotData>({ resolver: zodResolver(forgotSchema) });

  const onSubmit = async (data: ForgotData) => {
    setLoading(true);
    try { await handleForgotPassword(data); setSent(true); } finally { setLoading(false); }
  };

  if (sent) return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(201,168,76,0.15)' }}>
        <CheckCircle size={32} style={{ color: '#C9A84C' }}/>
      </div>
      <h2 className="text-2xl font-bold" style={{ color: '#1a1560' }}>Check your email</h2>
      <p className="mt-2 text-sm" style={{ color: '#4a4a8a' }}>We sent a password reset link to your email address.</p>
      <Link to="/login" className="mt-6 block font-medium hover:opacity-80 transition-opacity" style={{ color: '#C9A84C' }}>Back to sign in</Link>
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2" style={{ color: '#1a1560' }}>Forgot password?</h1>
      <p className="text-sm mb-6" style={{ color: '#4a4a8a' }}>Enter your email and we'll send you a reset link.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Email address" type="email" placeholder="you@campus.edu" leftIcon={<Mail size={16}/>}
          error={errors.email?.message} {...register('email')}/>
        <Button type="submit" className="w-full" size="lg" loading={loading}
          style={{ background: 'linear-gradient(135deg, #1a1560, #24243e)', border: 'none' }}>
          Send reset link
        </Button>
      </form>
      <Link to="/login" className="mt-4 block text-center text-sm font-medium hover:opacity-80 transition-opacity" style={{ color: '#C9A84C' }}>
        Back to sign in
      </Link>
    </div>
  );
};

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────
const resetSchema = z.object({
  password: z.string().min(8, 'Min 8 characters').regex(/[A-Z]/).regex(/[0-9]/),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: "Passwords don't match", path: ['confirm'] });
type ResetData = z.infer<typeof resetSchema>;

export const ResetPasswordPage: React.FC = () => {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const { handleResetPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<ResetData>({ resolver: zodResolver(resetSchema) });

  const onSubmit = async (data: ResetData) => {
    setLoading(true);
    try { await handleResetPassword({ token, password: data.password }); } finally { setLoading(false); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2" style={{ color: '#1a1560' }}>Reset your password</h1>
      <p className="text-sm mb-6" style={{ color: '#4a4a8a' }}>Enter your new password below.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="New Password" type="password" placeholder="Min 8 chars" leftIcon={<Lock size={16}/>}
          error={errors.password?.message} {...register('password')}/>
        <Input label="Confirm Password" type="password" placeholder="Repeat password" leftIcon={<Lock size={16}/>}
          error={errors.confirm?.message} {...register('confirm')}/>
        <Button type="submit" className="w-full" size="lg" loading={loading}
          style={{ background: 'linear-gradient(135deg, #1a1560, #24243e)', border: 'none' }}>
          Reset Password
        </Button>
      </form>
    </div>
  );
};

// ─── VERIFY EMAIL ─────────────────────────────────────────────────────────────
export const VerifyEmailPage: React.FC = () => {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>(
    token ? 'pending' : 'pending'
  );
  const calledRef = React.useRef(false);  // ← add this

  useEffect(() => {
    if (token && !calledRef.current) {
      calledRef.current = true;  // ← prevent second call
      import('../../services/authService').then(({ authService }) =>
        authService.verifyEmail(token)
          .then(() => setStatus('success'))
          .catch((err) => {
            console.log('Full error:', JSON.stringify(err?.response?.data));
            const msg = err?.response?.data?.error?.message || '';
            if (msg.toLowerCase().includes('already verified')) {
              setStatus('success');
            } else {
              setStatus('error');
            }
          })
      );
    }
  }, [token]);
  // ... rest of JSX stays the same

  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
        style={{ background: status === 'success' ? 'rgba(201,168,76,0.15)' : status === 'error' ? 'rgba(220,38,38,0.1)' : 'rgba(26,21,96,0.08)' }}>
        {status === 'success' ? <CheckCircle size={32} style={{ color: '#C9A84C' }}/> :
         status === 'error' ? <span className="text-red-600 text-2xl">✕</span> :
         <Mail size={32} style={{ color: '#1a1560' }}/>}
      </div>
      {!token ? (
        <>
          <h2 className="text-2xl font-bold" style={{ color: '#1a1560' }}>Verify your email</h2>
          <p className="mt-2 text-sm" style={{ color: '#4a4a8a' }}>We sent a verification link to your email. Click the link to activate your account.</p>
        </>
      ) : status === 'success' ? (
        <>
          <h2 className="text-2xl font-bold" style={{ color: '#1a1560' }}>Email verified!</h2>
          <p className="mt-2 text-sm" style={{ color: '#4a4a8a' }}>Your account is now active.</p>
          <Link to="/login" className="mt-6 inline-block px-6 py-2.5 text-white rounded-xl font-medium transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #1a1560, #24243e)' }}>
            Go to Login
          </Link>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-bold" style={{ color: '#1a1560' }}>Verification failed</h2>
          <p className="mt-2 text-sm" style={{ color: '#4a4a8a' }}>The link may have expired. Request a new one.</p>
          <Link to="/login" className="mt-6 inline-block font-medium hover:opacity-80 transition-opacity" style={{ color: '#C9A84C' }}>
            Back to Login
          </Link>
        </>
      )}
    </div>
  );
};

// ─── CORE JOIN ────────────────────────────────────────────────────────────────
const coreSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  clubId: z.string().min(1, 'Select a club'),
  role: z.string().min(1, 'Select a role'),
  accessCode: z.string().min(6, 'Enter your access code'),
});
type CoreData = z.infer<typeof coreSchema>;

export const CoreJoinPage: React.FC = () => {
  const { handleCoreJoin } = useAuth();
  const [loading, setLoading] = useState(false);
  const { clubs } = useClubs();
  const { register, handleSubmit, formState: { errors } } = useForm<CoreData>({ resolver: zodResolver(coreSchema) });

  const onSubmit = async (data: CoreData) => {
    setLoading(true);
    try { await handleCoreJoin(data); } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(201,168,76,0.15)' }}>
          <Key size={20} style={{ color: '#C9A84C' }}/>
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1a1560' }}>Core Member Access</h1>
          <p className="text-xs" style={{ color: '#4a4a8a' }}>Use your club-issued access code to join</p>
        </div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Full Name" placeholder="Your name" error={errors.name?.message} {...register('name')}/>
        <Input label="Email" type="email" placeholder="you@campus.edu" error={errors.email?.message} {...register('email')}/>
        <Select label="Club" error={errors.clubId?.message}
          options={[
            { value: '', label: 'Select your club' },
            ...clubs.map((club) => ({ value: club.id, label: club.name })),
          ]}
          {...register('clubId')}/>
        <Select label="Role" error={errors.role?.message}
          options={[
            { value: '', label: 'Select your role' },
            { value: 'member', label: 'Member' },
            { value: 'secretary', label: 'Secretary' },
            { value: 'event_manager', label: 'Event Manager' },
          ]}
          {...register('role')}/>
        <Input label="Access Code" placeholder="e.g. CDNG-2025-X7K4M2"
          helperText="Access code provided by your Super Admin"
          error={errors.accessCode?.message} {...register('accessCode')}/>
        <Button type="submit" className="w-full" size="lg" loading={loading}
          style={{ background: 'linear-gradient(135deg, #1a1560, #24243e)', border: 'none' }}>
          Join as Core Member
        </Button>
      </form>
      <Link to="/login" className="mt-4 block text-center text-sm font-medium hover:opacity-80 transition-opacity" style={{ color: '#C9A84C' }}>
        Already have an account? Sign in
      </Link>
    </div>
  );
};
