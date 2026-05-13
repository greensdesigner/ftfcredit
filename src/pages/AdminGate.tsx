import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import AdminDashboard from './AdminDashboard';

const SECRET_CODE = "FTF-8899"; // Your Secret Access Code

export default function AdminGate() {
  const [passcode, setPasscode] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate a small delay for "Security Verification" feel
    setTimeout(() => {
      if (passcode === SECRET_CODE) {
        setIsAuthorized(true);
        setError(false);
      } else {
        setError(true);
        setPasscode('');
      }
      setLoading(false);
    }, 800);
  };

  if (isAuthorized) {
    return <AdminDashboard />;
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-[32px] p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="size-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <ShieldCheck size={32} />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Admin Authentication</h1>
            <p className="text-sm text-neutral-500">Please enter your specialized access code to proceed to the command center.</p>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600">
                <Lock size={18} />
              </div>
              <input 
                type="password"
                placeholder="Enter Access Code"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  setError(false);
                }}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-2xl py-4 pl-12 pr-4 text-white text-center font-mono tracking-widest placeholder:tracking-normal placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 text-red-400 text-xs font-bold justify-center"
                >
                  <AlertCircle size={14} />
                  Invalid Authentication Code. Authorized Access Only.
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              disabled={loading || !passcode}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-indigo-500/10 group"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  Verify Access
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 pt-8 border-t border-neutral-800 text-center">
          <p className="text-[10px] text-neutral-600 uppercase tracking-[0.2em] font-medium">Secure Portal • Environment: Production</p>
        </div>
      </motion.div>
    </div>
  );
}
