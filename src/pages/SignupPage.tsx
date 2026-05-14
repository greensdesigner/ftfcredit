import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { User, Mail, Phone, Lock, ArrowRight, Eye, EyeOff, Briefcase, UserCircle, MapPin } from 'lucide-react';
import { UserRole } from '../types';
import { cn } from '../lib/utils';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.CLIENT);
  const [showPassword, setShowPassword] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      alert("Please enter a valid email address.");
      return;
    }

    try {
      await signup(email, password, fullName, phone, role, agencyName, streetAddress);
      if (role === UserRole.ADMIN) {
        navigate('/admin-portal');
      } else {
        navigate('/onboarding');
      }
    } catch (err) {
      // Error is handled in AuthContext (alert)
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 rounded-3xl bg-white p-10 border border-neutral-100 shadow-sm"
      >
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-900 text-white font-display text-2xl font-bold">FTF</div>
          <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-neutral-900">Create Account</h1>
          <p className="mt-2 text-neutral-500">Join the platform as a Client or Agency Owner</p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Role Selection */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => setRole(UserRole.CLIENT)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all",
                  role === UserRole.CLIENT 
                    ? "border-neutral-900 bg-neutral-900 text-white shadow-lg" 
                    : "border-neutral-100 bg-neutral-50 text-neutral-500 hover:border-neutral-200"
                )}
              >
                <UserCircle size={24} />
                <span className="text-xs font-bold uppercase tracking-widest">Client</span>
              </button>
              <button
                type="button"
                onClick={() => setRole(UserRole.ADMIN)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all",
                  role === UserRole.ADMIN 
                    ? "border-neutral-900 bg-neutral-900 text-white shadow-lg" 
                    : "border-neutral-100 bg-neutral-50 text-neutral-500 hover:border-neutral-200"
                )}
              >
                <Briefcase size={24} />
                <span className="text-xs font-bold uppercase tracking-widest">Agency</span>
              </button>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="block w-full rounded-xl border border-neutral-200 pl-11 pr-4 py-3 text-neutral-900 outline-none transition-all placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                  placeholder="John Doe"
                />
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Email address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-neutral-200 pl-11 pr-4 py-3 text-neutral-900 outline-none transition-all placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                  placeholder="name@company.com"
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Phone Number</label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="block w-full rounded-xl border border-neutral-200 pl-11 pr-4 py-3 text-neutral-900 outline-none transition-all placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                  placeholder="+1 (555) 000-0000"
                />
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
              </div>
            </div>

            {role === UserRole.ADMIN ? (
              <>
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="relative"
                >
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Agency / Company Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={agencyName}
                      onChange={(e) => setAgencyName(e.target.value)}
                      className="block w-full rounded-xl border border-neutral-200 pl-11 pr-4 py-3 text-neutral-900 outline-none transition-all placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 font-bold"
                      placeholder="My Credit Agency"
                    />
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="relative"
                >
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Office Address</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      className="block w-full rounded-xl border border-neutral-200 pl-11 pr-4 py-3 text-neutral-900 outline-none transition-all placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                      placeholder="123 Business St, Suite 100"
                    />
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                  </div>
                </motion.div>
              </>
            ) : (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="relative"
              >
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Agency Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    className="block w-full rounded-xl border border-neutral-200 pl-11 pr-4 py-3 text-neutral-900 outline-none transition-all placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                    placeholder="Enter agency email to connect..."
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                </div>
                <p className="text-[10px] text-neutral-400 mt-1.5 ml-1">Your dashboard will be managed by the agency associated with this email</p>
              </motion.div>
            )}

            <div className="relative">
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-neutral-200 pl-11 pr-12 py-3 text-neutral-900 outline-none transition-all placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                  placeholder="••••••••"
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <input 
              id="terms" 
              name="terms" 
              type="checkbox" 
              required
              className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900" 
            />
            <label htmlFor="terms" className="ml-2 block text-xs text-neutral-600">
              I agree to the <Link to="/terms" className="text-neutral-900 font-semibold hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-neutral-900 font-semibold hover:underline">Privacy Policy</Link>
            </label>
          </div>

          <button
            type="submit"
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 py-3.5 text-sm font-semibold text-white shadow-xl transition-all hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2"
          >
            Create {role === UserRole.ADMIN ? 'Agency' : 'Client'} Account
            <ArrowRight className="transition-transform group-hover:translate-x-1" size={18} />
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-neutral-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-neutral-900 hover:underline decoration-neutral-900 underline-offset-4">Log in</Link>
        </p>
      </motion.div>
    </div>
  );
}
