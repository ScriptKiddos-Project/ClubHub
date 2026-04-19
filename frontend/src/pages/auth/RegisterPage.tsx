import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User, BookOpen, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain a number'),
  department: z.string().min(2, 'Department is required'),
  enrollmentYear: z.coerce.number().min(2000).max(2030),
  degreeType: z.enum(['bachelors', 'masters', 'phd', 'diploma']),
});
type FormData = z.infer<typeof schema>;

const RegisterPage: React.FC = () => {
  const { handleRegister } = useAuth();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as never,
    defaultValues: { degreeType: 'bachelors', enrollmentYear: new Date().getFullYear() },
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setLoading(true);
    try { await handleRegister(data); } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="mb-6">
        <div className="lg:hidden flex items-center gap-2 mb-6">
          <img src="/logo.png" alt="ClubHub" className="w-10 h-10 object-contain" />
        </div>
        <h1 className="text-2xl font-bold" style={{ color: '#1a1560' }}>Create your account</h1>
        <p className="mt-1 text-sm" style={{ color: '#4a4a8a' }}>Join thousands of students on campus</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Full Name" placeholder="John Doe" leftIcon={<User size={16}/>}
          error={errors.name?.message} {...register('name')}/>
        <Input label="Campus Email" type="email" placeholder="you@campus.edu" leftIcon={<Mail size={16}/>}
          error={errors.email?.message} {...register('email')}/>
        <Input label="Password" type={showPass ? 'text' : 'password'} placeholder="Min 8 chars, 1 uppercase, 1 number"
          leftIcon={<Lock size={16}/>}
          rightIcon={
            <button type="button" onClick={() => setShowPass(!showPass)} className="cursor-pointer">
              {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
            </button>
          }
          error={errors.password?.message} {...register('password')}/>
        <Input label="Department" placeholder="e.g. Computer Science" leftIcon={<BookOpen size={16}/>}
          error={errors.department?.message} {...register('department')}/>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Enrollment Year" type="number" placeholder="2024"
            error={errors.enrollmentYear?.message} {...register('enrollmentYear')}/>
          <Select label="Degree Type" error={errors.degreeType?.message}
            options={[
              { value: 'bachelors', label: "Bachelor's" },
              { value: 'masters', label: "Master's" },
              { value: 'phd', label: 'PhD' },
              { value: 'diploma', label: 'Diploma' },
            ]} {...register('degreeType')}/>
        </div>
        <p className="text-xs" style={{ color: '#4a4a8a' }}>
          By registering, you agree to our{' '}
          <a href="#" className="hover:opacity-80 transition-opacity" style={{ color: '#C9A84C' }}>Terms</a> and{' '}
          <a href="#" className="hover:opacity-80 transition-opacity" style={{ color: '#C9A84C' }}>Privacy Policy</a>.
        </p>
        <Button type="submit" className="w-full" size="lg" loading={loading}
          style={{ background: 'linear-gradient(135deg, #1a1560, #24243e)', border: 'none' }}>
          Create Account
        </Button>
      </form>

      <p className="mt-5 text-center text-sm" style={{ color: '#4a4a8a' }}>
        Already have an account?{' '}
        <Link to="/login" className="font-semibold hover:opacity-80 transition-opacity" style={{ color: '#C9A84C' }}>
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default RegisterPage;