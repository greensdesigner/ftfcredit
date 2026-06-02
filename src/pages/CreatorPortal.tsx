import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Plus, Trash2, Copy, Check, RefreshCw, Key, LogOut, CheckCircle, Database } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ActivationKey {
  id: number;
  keyCode: string;
  isUsed: boolean;
  usedByEmail: string | null;
  createdAt: string;
  usedAt: string | null;
}

export default function CreatorPortal() {
  const [keys, setKeys] = useState<ActivationKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/creator/keys');
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
      }
    } catch (err) {
      console.error("Failed to fetch keys:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleGenerateKey = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/creator/keys/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setFeedback(`New code ${data.keyCode} generated successfully!`);
        fetchKeys();
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch (err) {
      console.error("Failed to generate key:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteKey = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete/revoke this activation key?")) return;
    try {
      const res = await fetch('/api/creator/keys/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        fetchKeys();
      }
    } catch (err) {
      console.error("Failed to delete key:", err);
    }
  };

  const handleCopy = (keyCode: string, id: number) => {
    navigator.clipboard.writeText(keyCode);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans uppercase tracking-tight p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-4xl w-full">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-neutral-900 border border-neutral-800 p-8 rounded-[32px]">
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <ShieldAlert size={36} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-widest">Creator Portal</h1>
              <p className="text-[10px] text-neutral-500 font-extrabold tracking-wider">Strategic licensing & bypass key generation system.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchKeys} 
              disabled={loading}
              className="p-3.5 rounded-2xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white transition-all disabled:opacity-50 border border-neutral-700/50"
              title="Refresh Codes"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
            <Link 
              to="/admin-portal" 
              className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-bold text-xs border border-neutral-700/50 transition-all text-center"
            >
              <LogOut size={14} /> Back to Gate
            </Link>
          </div>
        </div>

        {/* Generate Action Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-neutral-900 border border-neutral-800 p-8 rounded-[32px] flex flex-col justify-between">
            <div>
              <span className="text-[9px] font-black tracking-[0.25em] text-indigo-400">Authorization Factory</span>
              <h2 className="text-xl font-bold tracking-tighter text-white mt-1 mb-3">Instant Command Bypass Generator</h2>
              <p className="text-[11px] text-neutral-400 font-bold leading-normal lowercase normal-case tracking-normal">
                Generate high-entropy activation keys to instantly unlock standard command center encryption. Each key created here persists inside the database until revoked.
              </p>
            </div>
            <div className="mt-6">
              <button
                onClick={handleGenerateKey}
                disabled={generating}
                className="flex items-center gap-2 px-6 py-4 bg-white hover:bg-neutral-100 disabled:opacity-40 text-neutral-950 font-black text-xs rounded-2xl transition-all shadow-xl shadow-white/5 active:scale-[0.98]"
              >
                {generating ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} /> Creating Entry Key...
                  </>
                ) : (
                  <>
                    <Plus size={16} /> Generate Activation Key
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-[32px] flex flex-col justify-between">
            <div>
              <span className="text-[9px] font-black tracking-[0.25em] text-emerald-400">Database Statisics</span>
              <h2 className="text-xl font-bold tracking-tighter text-white mt-1 mb-3">Platform Integrity</h2>
              <p className="text-[11px] text-neutral-500 font-normal leading-relaxed lowercase normal-case tracking-normal">
                Check database connectivity and manage current live tokens easily. Total registered security keys shown below.
              </p>
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-neutral-800/80">
              <div className="flex items-center gap-2 text-xs font-bold text-neutral-400">
                <Database size={14} /> Pool Connected
              </div>
              <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                {keys.length} Total Key{keys.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Alerts */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 mb-6 bg-indigo-950/50 border border-indigo-500/30 text-indigo-200 text-xs font-bold tracking-wider rounded-2xl flex items-center gap-3 animate-pulse"
            >
              <Key size={16} className="text-indigo-400 shrink-0" />
              <span>{feedback}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Keys Inventory */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-[32px] overflow-hidden">
          <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
            <h3 className="text-sm font-black text-neutral-200 tracking-widest">Active Keys Registry</h3>
            <span className="text-[10px] text-neutral-500 font-extrabold">Generated License Keys</span>
          </div>

          {loading && keys.length === 0 ? (
            <div className="p-12 text-center text-neutral-500 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="animate-spin text-neutral-600" size={32} />
              <p className="text-xs font-black">Scanning database indices...</p>
            </div>
          ) : keys.length === 0 ? (
            <div className="p-16 text-center text-neutral-600 space-y-2">
              <Key size={40} strokeWidth={1} className="mx-auto text-neutral-700" />
              <p className="text-xs font-black tracking-widest uppercase">No keys found</p>
              <p className="text-[10px] lowercase normal-case text-neutral-500 tracking-normal max-w-xs mx-auto">
                Press "Generate Activation Key" to populate entry points for onboarding standard administrators.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-800/60 max-h-[450px] overflow-y-auto">
              {keys.map((k) => (
                <div key={k.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-850 transition-all duration-300">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-lg font-black tracking-[0.2em] text-white">
                        {k.keyCode}
                      </span>
                      {k.isUsed ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider">
                          Used
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-md uppercase tracking-wider">
                          Active / Available
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] text-neutral-500 font-extrabold tracking-wider">
                      <span>Created On: {new Date(k.createdAt).toLocaleString()}</span>
                      {k.isUsed && k.usedByEmail && (
                        <span className="text-indigo-400">
                          Activated By: {k.usedByEmail}
                        </span>
                      )}
                      {k.isUsed && k.usedAt && (
                        <span>Activated On: {new Date(k.usedAt).toLocaleString()}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleCopy(k.keyCode, k.id)}
                      className="p-3.5 rounded-xl bg-neutral-850 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-all border border-neutral-800"
                      title="Copy Key Code"
                    >
                      {copiedKeyId === k.id ? (
                        <Check size={14} className="text-emerald-400" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteKey(k.id)}
                      className="p-3.5 rounded-xl bg-red-950/20 hover:bg-red-950/60 text-red-400 hover:text-red-300 transition-all border border-red-950/40"
                      title="Delete / Revoke Key"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
