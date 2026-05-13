import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Lock, ArrowRight, AlertCircle, Loader2, UserX } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { Link } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';

const SECRET_CODE = "FTF-8899"; // Your Secret Access Code

export default function AdminGate() {
  const { user } = useAuth();
  const [passcode, setPasscode] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [errorType, setErrorType] = useState<'none' | 'invalid_code' | 'unauthorized'>('none');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorType('none');
    
    setTimeout(() => {
      if (passcode === SECRET_CODE) {
        setIsAuthorized(true);
        setErrorType('none');
      } else {
        setErrorType('invalid_code');
        setPasscode('');
      }
      setLoading(false);
    }, 800);
  };

  // If authorized via code, show dashboard
  if (isAuthorized) {
    return <AdminDashboard />;
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 font-sans uppercase tracking-tight">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-[32px] p-10 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-gradient-x"></div>
        
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="size-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
            <ShieldCheck size={40} strokeWidth={1.5} />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-white tracking-tighter">Command Center</h1>
            <p className="text-xs text-neutral-500 font-bold tracking-widest leading-relaxed">Enter specialized access code to bypass standard encryption.</p>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-600">
                <Lock size={20} />
              </div>
              <input 
                type="password"
                placeholder="Enter Code"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  setErrorType('none');
                }}
                className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-2xl py-5 pl-14 pr-4 text-white text-center font-mono text-xl tracking-[0.5em] placeholder:tracking-normal placeholder:text-neutral-700 placeholder:text-sm focus:outline-none focus:border-indigo-500/50 focus:bg-neutral-800 transition-all"
              />
            </div>

            <AnimatePresence>
              {errorType !== 'none' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-col items-center gap-2 text-red-400 text-[10px] font-black justify-center tracking-widest uppercase text-center"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle size={14} />
                    Access Denied. Signature Mismatch.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              disabled={loading || !passcode}
              className="w-full bg-white hover:bg-neutral-100 disabled:opacity-30 text-neutral-950 font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-white/5 group text-sm uppercase tracking-widest"
            >
              {loading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <>
                  Engage Authentication
                  <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-10 pt-10 border-t border-neutral-800/50 text-center flex flex-col gap-2">
          <p className="text-[9px] text-neutral-600 uppercase tracking-[0.3em] font-black italic">Restricted Asset • ID: 155-XP-FTF</p>
          <p className="text-[8px] text-neutral-700 font-bold leading-relaxed px-4">Unauthorized access to this portal is a violation of the FTF Security Protocol. All connection attempts are logged.</p>
        </div>
      </motion.div>
    </div>
  );
}
