import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, Plus, Trash2, Copy, Check, RefreshCw, Key, LogOut, 
  CheckCircle, Database, Users, Download, Lock, Unlock, Search, 
  Calendar, Phone, Mail, Building 
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ActivationKey {
  id: number;
  keyCode: string;
  isUsed: boolean;
  usedByEmail: string | null;
  createdAt: string;
  usedAt: string | null;
}

interface UserRecord {
  uid: string;
  email: string;
  fullName: string;
  role: 'client' | 'admin' | 'super_admin';
  phone?: string;
  agencyName?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  isSuspended: boolean | number;
  createdAt: string | number;
  tenantId?: string;
}

export default function CreatorPortal() {
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return sessionStorage.getItem('creator_portal_unlocked') === 'true';
  });
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);

  const [activeTab, setActiveTab] = useState<'keys' | 'users'>('users');
  const [keys, setKeys] = useState<ActivationKey[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'client'>('all');

  const fetchKeys = async () => {
    try {
      const res = await fetch('/api/creator/keys');
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
      }
    } catch (err) {
      console.error("Failed to fetch keys:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/creator/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([fetchKeys(), fetchUsers()]);
    setLoading(false);
  };

  useEffect(() => {
    const originalTitle = document.title;
    document.title = "greensoft";
    loadAllData();
    return () => {
      document.title = originalTitle;
    };
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
        setFeedback(`New Bypass Key ${data.keyCode} generated successfully!`);
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

  // Toggle user suspension (Admin blockade toggle)
  const handleToggleSuspension = async (uid: string, currentSuspension: boolean | number) => {
    const nextStatus = !currentSuspension;
    const confirmMessage = nextStatus 
      ? "দিনের পর দিন সাবস্ক্রিপশন ফি অপরিশোধিত থাকায় আপনি কি এই এডমিনের একাউন্ট ও ড্যাশবোর্ড বন্ধ করতে চান?"
      : "আপনি কি পুনরায় এই এডমিনের একাউন্ট ও ড্যাশবোর্ড সচল করতে চান?";
    
    if (!window.confirm(confirmMessage)) return;

    try {
      const res = await fetch('/api/creator/users/toggle-suspension', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, isSuspended: nextStatus }),
      });
      if (res.ok) {
        fetchUsers();
        setFeedback(`একাউন্টের স্ট্যাটাস সফলভাবে আপডেট করা হয়েছে! (${nextStatus ? 'বন্ধ' : 'সচল'})`);
        setTimeout(() => setFeedback(null), 4000);
      } else {
        alert("স্ট্যাটাস আপডেট করতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।");
      }
    } catch (err) {
      console.error("Failed to toggle suspension:", err);
    }
  };

  // Client-Side CSV Spreadsheet Generator
  const handleDownloadSpreadsheet = (filter: 'all' | 'admin' | 'client') => {
    let dataset = users;
    if (filter !== 'all') {
      dataset = users.filter(u => u.role === filter);
    }

    if (dataset.length === 0) {
      alert("কোন ডাটা ডাউনলোডের জন্য উপলব্ধ নেই।");
      return;
    }

    // CSV header row
    const headers = [
      "User ID (UID)",
      "Full Name",
      "Email Address",
      "System Role",
      "Phone Number",
      "Agency/Company Name",
      "Street Address",
      "City",
      "State",
      "ZIP Code",
      "Subscription Status",
      "Registration Date"
    ];

    // CSV mapping
    const rows = dataset.map(u => [
      u.uid,
      u.fullName,
      u.email,
      u.role.toUpperCase(),
      u.phone || 'N/A',
      u.agencyName || 'N/A',
      u.streetAddress || 'N/A',
      u.city || 'N/A',
      u.state || 'N/A',
      u.zipCode || 'N/A',
      (u.isSuspended === 1 || u.isSuspended === true) ? "SUSPENDED (UNPAID)" : "ACTIVE (PAID)",
      new Date(u.createdAt).toLocaleString()
    ]);

    // Construct CSV String
    const csvContent = "\uFEFF" // UTF-8 BOM representation for correct Excel character rendering
      + [headers.join(","), ...rows.map(r => r.map(columnVal => `"${String(columnVal).replace(/"/g, '""')}"`).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `FTF_${filter.toUpperCase()}_DATA_SHEET_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filters search key
  const filteredUsers = users.filter(usr => {
    const matchSearch = 
      usr.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usr.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usr.agencyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usr.uid?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (roleFilter === 'all') return matchSearch;
    return matchSearch && usr.role === roleFilter;
  });

  const adminsCount = users.filter(u => u.role === 'admin').length;
  const clientsCount = users.filter(u => u.role === 'client').length;

  if (!isUnlocked) {
    const handleVerifyPasscode = (e: React.FormEvent) => {
      e.preventDefault();
      if (passcode === '2562686') {
        sessionStorage.setItem('creator_portal_unlocked', 'true');
        setIsUnlocked(true);
        setPasscodeError(false);
      } else {
        setPasscodeError(true);
      }
    };

    return (
      <div className="min-h-screen bg-neutral-950 text-white font-sans flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-[32px] p-8 md:p-10 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-indigo-500 to-purple-500"></div>
          
          <div className="text-center space-y-3 mb-8">
            <div className="mx-auto size-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
              <Lock size={28} />
            </div>
            <h1 className="text-xl font-black text-white tracking-widest uppercase">Developer Portal Gate</h1>
            <p className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider">Authentication Required to Access Database</p>
          </div>

          <form onSubmit={handleVerifyPasscode} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black tracking-widest text-neutral-400 uppercase">Enter Security Clearance Code</label>
              <input
                type="password"
                placeholder="••••••"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  if (passcodeError) setPasscodeError(false);
                }}
                className={`w-full bg-neutral-950 border text-center font-mono text-xl tracking-[0.25em] text-white rounded-2xl py-4 px-4 focus:outline-none transition-all ${
                  passcodeError 
                    ? 'border-red-500/60 focus:border-red-500' 
                    : 'border-neutral-800 focus:border-indigo-500'
                }`}
              />
              {passcodeError && (
                <p className="text-[10px] text-red-500 font-bold text-center mt-2">
                  Incorrect gate code! Please try again.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs tracking-widest uppercase transition-all shadow-xl shadow-indigo-500/10"
            >
              Verify & Unlock
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-neutral-850 text-center">
            <Link to="/admin-portal" className="text-[10px] text-neutral-500 hover:text-white font-bold transition-all uppercase tracking-widest">
              ⚡ Exit to Portal Gate
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-6xl w-full">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 bg-neutral-900 border border-neutral-800 p-8 rounded-[32px]">
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <ShieldAlert size={36} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-widest uppercase">Creator Command Hub</h1>
              <p className="text-[10px] text-neutral-500 font-extrabold tracking-wider uppercase">App Developer & Builder Administrative Panel.</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={loadAllData} 
              disabled={loading}
              className="p-3.5 rounded-2xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white transition-all disabled:opacity-50 border border-neutral-700/50"
              title="Refresh Data"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
            <Link 
              to="/admin-portal" 
              className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-bold text-xs border border-neutral-700/50 transition-all text-center uppercase tracking-wider"
            >
              <LogOut size={14} /> Back to Gate
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-800 gap-2 mb-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 font-bold text-xs uppercase tracking-widest transition-all border-b-2 ${
              activeTab === 'users' 
                ? 'border-indigo-500 text-white' 
                : 'border-transparent text-neutral-500 hover:text-neutral-350'
            }`}
          >
            👥 Clients & Admins Directory ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('keys')}
            className={`px-6 py-3 font-bold text-xs uppercase tracking-widest transition-all border-b-2 ${
              activeTab === 'keys' 
                ? 'border-indigo-500 text-white' 
                : 'border-transparent text-neutral-500 hover:text-neutral-350'
            }`}
          >
            🔑 Security Keys Factory ({keys.length})
          </button>
        </div>

        {/* Dynamic Alerts */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 mb-6 bg-indigo-950/50 border border-indigo-500/30 text-indigo-200 text-xs font-semibold tracking-wider rounded-2xl flex items-center gap-3"
            >
              <CheckCircle size={16} className="text-indigo-400 shrink-0" />
              <span>{feedback}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {activeTab === 'users' ? (
          /* USERS DIRECTORY VIEW */
          <div className="space-y-6">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-[24px] flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-black tracking-widest text-indigo-400 uppercase">System Administrators</span>
                  <h3 className="text-3xl font-black tracking-tight text-white mt-1">{adminsCount} Agency Admins</h3>
                  <p className="text-[10px] text-neutral-400 mt-2 lowercase normal-case tracking-normal">These are businesses/agencies running credit repair centers in the system.</p>
                </div>
                <button
                  onClick={() => handleDownloadSpreadsheet('admin')}
                  className="mt-6 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-500 hover:bg-indigo-650 text-white font-bold text-xs rounded-xl transition-all uppercase tracking-wider"
                >
                  <Download size={14} /> Download Admins CSV
                </button>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-[24px] flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-black tracking-widest text-emerald-400 uppercase">Tenant Clients</span>
                  <h3 className="text-3xl font-black tracking-tight text-white mt-1">{clientsCount} Registered Clients</h3>
                  <p className="text-[10px] text-neutral-400 mt-2 lowercase normal-case tracking-normal">These are private platform users taking care of their credit score improvements.</p>
                </div>
                <button
                  onClick={() => handleDownloadSpreadsheet('client')}
                  className="mt-6 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-650 text-neutral-950 font-bold text-xs rounded-xl transition-all uppercase tracking-wider"
                >
                  <Download size={14} /> Download Clients CSV
                </button>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-[24px] flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-black tracking-widest text-amber-500 uppercase">Master Spreadsheet</span>
                  <h3 className="text-3xl font-black tracking-tight text-white mt-1">Full Database</h3>
                  <p className="text-[10px] text-neutral-400 mt-2 lowercase normal-case tracking-normal">All system records combined in one sheet with custom data pointers.</p>
                </div>
                <button
                  onClick={() => handleDownloadSpreadsheet('all')}
                  className="mt-6 flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-neutral-150 text-neutral-950 font-bold text-xs rounded-xl transition-all uppercase tracking-wider"
                >
                  <Download size={14} /> Download Full Master CSV
                </button>
              </div>
            </div>

            {/* Filtering Controls */}
            <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-[24px] flex flex-col md:flex-row items-center gap-4">
              <div className="relative w-full md:flex-1">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Search by name, email, agency or UID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl py-3 pl-11 pr-4 text-xs font-bold focus:outline-none focus:border-indigo-500 transition-all uppercase placeholder-neutral-600"
                />
              </div>

              <div className="flex gap-2 w-full md:w-auto shrink-0 justify-end">
                <button
                  onClick={() => setRoleFilter('all')}
                  className={`px-4 py-3 rounded-xl font-extrabold text-[10px] uppercase tracking-wider transition-all border ${
                    roleFilter === 'all' 
                      ? 'bg-white text-neutral-950 border-white' 
                      : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                  }`}
                >
                  All Users
                </button>
                <button
                  onClick={() => setRoleFilter('admin')}
                  className={`px-4 py-3 rounded-xl font-extrabold text-[10px] uppercase tracking-wider transition-all border ${
                    roleFilter === 'admin' 
                      ? 'bg-indigo-500 text-white border-indigo-500' 
                      : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                  }`}
                >
                  Admins Only
                </button>
                <button
                  onClick={() => setRoleFilter('client')}
                  className={`px-4 py-3 rounded-xl font-extrabold text-[10px] uppercase tracking-wider transition-all border ${
                    roleFilter === 'client' 
                      ? 'bg-emerald-500 text-neutral-950 border-emerald-500' 
                      : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                  }`}
                >
                  Clients Only
                </button>
              </div>
            </div>

            {/* Users List */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-[24px] overflow-hidden">
              <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
                <h3 className="text-xs font-black text-neutral-200 tracking-widest uppercase">System Users Catalog</h3>
                <span className="text-[10px] text-neutral-500 font-extrabold uppercase">Showing {filteredUsers.length} of {users.length} Records</span>
              </div>

              {loading ? (
                <div className="p-16 text-center text-neutral-500 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="animate-spin text-neutral-600" size={32} />
                  <p className="text-xs font-black uppercase">Loading users database index...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-16 text-center text-neutral-500 space-y-2">
                  <Users size={40} className="mx-auto text-neutral-700 mb-2" />
                  <p className="text-xs font-black uppercase tracking-widest">No users matched</p>
                  <p className="text-[10px] lowercase normal-case text-neutral-500 tracking-normal max-w-xs mx-auto">
                    Try adjusting your filters or search criteria.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-800/60">
                  {filteredUsers.map((u) => {
                    const isSuspended = u.isSuspended === 1 || u.isSuspended === true;
                    return (
                      <div key={u.uid} className="p-6 hover:bg-neutral-850/80 transition-all duration-300 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="space-y-3 flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="font-extrabold text-sm text-white">{u.fullName}</span>
                            
                            {/* Role Badge */}
                            {u.role === 'admin' ? (
                              <span className="inline-flex items-center text-[9px] font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                ADMIN (Agency)
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-[9px] font-black text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                CLIENT (User)
                              </span>
                            )}

                            {/* Status Badge */}
                            {isSuspended ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-black text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider animate-pulse">
                                <Lock size={10} /> SUSPENDED (UNPAID)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                <Unlock size={10} /> ACTIVE / PAID
                              </span>
                            )}
                          </div>

                          {/* Details Metadata */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-2 text-[10px] text-neutral-400 tracking-normal">
                            <div className="flex items-center gap-2">
                              <Mail size={12} className="text-neutral-500 shrink-0" />
                              <span className="truncate">{u.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone size={12} className="text-neutral-500 shrink-0" />
                              <span>{u.phone || 'No phone'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Building size={12} className="text-neutral-500 shrink-0" />
                              <span className="truncate">{u.agencyName || 'No Agency Link'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar size={12} className="text-neutral-500 shrink-0" />
                              <span>Registered: {new Date(u.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>

                          {u.streetAddress && (
                            <p className="text-[9px] text-neutral-500 uppercase tracking-widest leading-relaxed">
                              📍 Address: {u.streetAddress}, {u.city || ''}, {u.state || ''} {u.zipCode || ''}
                            </p>
                          )}
                        </div>

                        {/* Suspension Toggle Action Button */}
                        <div className="shrink-0 flex items-center">
                          {isSuspended ? (
                            <button
                              onClick={() => handleToggleSuspension(u.uid, u.isSuspended)}
                              className="flex items-center gap-1 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-550 hover:text-neutral-950 text-emerald-400 font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all"
                              title="Click to Activate User Dashboard"
                            >
                              <Unlock size={12} /> Activate Admin Dashboard
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleSuspension(u.uid, u.isSuspended)}
                              className="flex items-center gap-1 px-4 py-2.5 bg-red-950/20 border border-red-950/40 hover:bg-red-950 text-red-400 font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all"
                              title="Click to Block/Suspend User Dashboard"
                            >
                              <Lock size={12} /> Suspend Admin (Unpaid)
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* SECURITY BYPASS KEYS VIEW */
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-neutral-900 border border-neutral-800 p-8 rounded-[32px] flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-black tracking-[0.25em] text-indigo-400 uppercase">Authorization Factory</span>
                  <h2 className="text-xl font-bold tracking-tighter text-white mt-1 mb-3 uppercase">Instant Bypass Creator</h2>
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
                  <span className="text-[9px] font-black tracking-[0.25em] text-emerald-400 uppercase">Bypass Stats</span>
                  <h2 className="text-xl font-bold tracking-tighter text-white mt-1 mb-3 uppercase font-black">Total Keys</h2>
                  <p className="text-[11px] text-neutral-500 font-normal leading-relaxed lowercase normal-case tracking-normal">
                    Check database connectivity and manage current live tokens easily. Total registered security keys shown below.
                  </p>
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-neutral-800/80">
                  <div className="flex items-center gap-2 text-xs font-bold text-neutral-400">
                    <Database size={14} /> Pool Connected
                  </div>
                  <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {keys.length} Key{keys.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Keys Inventory */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-[32px] overflow-hidden">
              <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
                <h3 className="text-sm font-black text-neutral-200 tracking-widest uppercase">Active Keys Registry</h3>
                <span className="text-[10px] text-neutral-500 font-extrabold uppercase">Generated License Keys</span>
              </div>

              {loading && keys.length === 0 ? (
                <div className="p-12 text-center text-neutral-500 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="animate-spin text-neutral-600" size={32} />
                  <p className="text-xs font-black uppercase">Scanning database indices...</p>
                </div>
              ) : keys.length === 0 ? (
                <div className="p-16 text-center text-neutral-600 space-y-2">
                  <Key size={40} strokeWidth={1} className="mx-auto text-neutral-700" />
                  <p className="text-xs font-black tracking-widest uppercase mb-1">No keys found</p>
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

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] text-neutral-500 font-extrabold tracking-wider uppercase">
                          <span>Created On: {new Date(k.createdAt).toLocaleString()}</span>
                          {k.isUsed && k.usedByEmail && (
                            <span className="text-indigo-400 lowercase normal-case tracking-normal">
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
        )}
      </div>
    </div>
  );
}
