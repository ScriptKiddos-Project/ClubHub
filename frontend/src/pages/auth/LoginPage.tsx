import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type FormData = z.infer<typeof schema>;

const LoginPage: React.FC = () => {
  const { handleLogin } = useAuth();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try { await handleLogin(data); } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="mb-8">
        <div className="lg:hidden flex items-center gap-2 mb-6">
          <img src="/logo.png" alt="ClubHub" className="w-10 h-10 object-contain" />
        </div>
        <h1 className="text-3xl font-bold" style={{ color: '#1a1560' }}>Welcome back</h1>
        <p className="mt-2" style={{ color: '#4a4a8a' }}>Sign in to your ClubHub account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="Email address"
          type="email"
          placeholder="you@campus.edu"
          leftIcon={<Mail size={16}/>}
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type={showPass ? 'text' : 'password'}
          placeholder="••••••••"
          leftIcon={<Lock size={16}/>}
          rightIcon={
            <button type="button" onClick={() => setShowPass(!showPass)} className="cursor-pointer">
              {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
            </button>
          }
          error={errors.password?.message}
          {...register('password')}
        />
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
            <input type="checkbox" className="rounded border-gray-300 focus:ring-indigo-500" style={{ accentColor: '#1a1560' }}/>
            Remember me
          </label>
          <Link to="/forgot-password" className="font-medium hover:opacity-80 transition-opacity" style={{ color: '#C9A84C' }}>
            Forgot password?
          </Link>
        </div>
        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={loading}
          style={{ background: 'linear-gradient(135deg, #1a1560, #24243e)', border: 'none' }}
        >
          Sign in
        </Button>
      </form>

      <div className="mt-6 text-center space-y-4">
        <p className="text-sm" style={{ color: '#4a4a8a' }}>
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold hover:opacity-80 transition-opacity" style={{ color: '#C9A84C' }}>
            Create account
          </Link>
        </p>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" style={{ borderColor: 'rgba(201,168,76,0.3)' }}/>
          </div>
          <div className="relative flex justify-center text-xs bg-white px-3" style={{ color: '#4a4a8a' }}>OR</div>
        </div>
        <Link
          to="/core/join"
          className="block w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-opacity hover:opacity-90 text-center"
          style={{ border: '1px solid #C9A84C', color: '#1a1560', background: 'linear-gradient(135deg, rgba(201,168,76,0.08), rgba(201,168,76,0.18))' }}
        >
          Join as Core Member with Access Code
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;