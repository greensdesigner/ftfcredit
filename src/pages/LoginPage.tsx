import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils';
import { UserRole } from '../types';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>(UserRole.CLIENT);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      // The login function in context updates the user state, we navigate based on what came back
      const savedUser = JSON.parse(localStorage.getItem('ftf_user') || '{}');
      navigate(savedUser.role === UserRole.ADMIN ? '/admin-portal' : '/dashboard');
    } catch (err) {
      // Error is handled in context (alerted)
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 rounded-3xl bg-white p-10 border border-neutral-100 shadow-sm"
      >
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-900 text-white font-display text-2xl font-bold">FTF</div>
          <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-neutral-900">Welcome back</h1>
          <p className="mt-2 text-neutral-500">Sign in to manage your credit repair journey</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-xl border border-neutral-200 px-4 py-3 text-neutral-900 outline-none transition-all placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                placeholder="name@company.com"
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-xl border border-neutral-200 px-4 py-3 text-neutral-900 outline-none transition-all placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-[38px] text-neutral-400 hover:text-neutral-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900" />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-neutral-600">Remember me</label>
            </div>
            <Link to="/forgot-password" size={20} className="text-sm font-medium text-neutral-900 hover:underline">Forgot password?</Link>
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center rounded-xl bg-neutral-900 py-3.5 text-sm font-semibold text-white shadow-xl transition-all hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2"
          >
            Sign in
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-neutral-500">
          New to FTF Consulting?{' '}
          <Link to="/signup" className="font-semibold text-neutral-900 hover:underline decoration-neutral-900 underline-offset-4">Create an account</Link>
        </p>
      </motion.div>
    </div>
  );
}
