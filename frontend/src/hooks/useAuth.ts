import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import type { LoginPayload, RegisterPayload, ForgotPasswordPayload, ResetPasswordPayload, CoreJoinPayload } from '../types';

export const useAuth = () => {
  const { user, isAuthenticated, login, logout: storeLogout, setLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = useCallback(async (payload: LoginPayload) => {
    try {
      const { data } = await authService.login(payload);
      login(data.data.user, data.data.accessToken);
      const role = data.data.user.role;
      if (role === 'super_admin') navigate('/admin/dashboard');
      else if (role === 'secretary' || role === 'event_manager') navigate('/admin/dashboard');
      else navigate('/dashboard');
      toast.success(`Welcome back, ${data.data.user.name.split(' ')[0]}!`);
    } catch {
      toast.error('Invalid email or password');
      throw new Error('Login failed');
    }
  }, [login, navigate]);

  const handleRegister = useCallback(async (payload: RegisterPayload) => {
    try {
      await authService.register(payload);
      toast.success('Account created! Please check your email to verify.');
      navigate('/verify-email');
    } catch {
      toast.error('Registration failed. Email may already be in use.');
      throw new Error('Register failed');
    }
  }, [navigate]);

  const handleLogout = useCallback(async () => {
    try { await authService.logout(); } catch { /* ignore */ }
    storeLogout();
    navigate('/login');
    toast.success('Logged out successfully');
  }, [storeLogout, navigate]);

  const handleForgotPassword = useCallback(async (payload: ForgotPasswordPayload) => {
    try {
      await authService.forgotPassword(payload);
      toast.success('Password reset email sent!');
    } catch {
      toast.error('Email not found');
      throw new Error('Forgot password failed');
    }
  }, []);

  const handleResetPassword = useCallback(async (payload: ResetPasswordPayload) => {
    try {
      await authService.resetPassword(payload);
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch {
      toast.error('Invalid or expired reset link');
      throw new Error('Reset failed');
    }
  }, [navigate]);

  const handleCoreJoin = useCallback(async (payload: CoreJoinPayload) => {
    try {
      const { data } = await authService.coreJoin(payload);
      login(data.data.user, data.data.accessToken);
      toast.success('Successfully joined as core member!');
      navigate('/dashboard');
    } catch {
      toast.error('Invalid access code or code expired');
      throw new Error('Core join failed');
    }
  }, [login, navigate]);

  return {
    user, isAuthenticated, setLoading,
    handleLogin, handleRegister, handleLogout,
    handleForgotPassword, handleResetPassword, handleCoreJoin,
  };
};
