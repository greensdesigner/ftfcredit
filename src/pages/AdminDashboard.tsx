import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import AdminInbox from '../components/AdminInbox';
import AdminMarketing from '../components/AdminMarketing';
import { useAuth } from '../context/AuthContext';
import { Users, CreditCard, AlertCircle, Search, Filter, MoreHorizontal, ArrowUpRight, ArrowDownRight, CheckCircle2, RotateCcw, Loader2, X, Mail, Phone, Calendar, User, MapPin, ShieldCheck, FileText, CheckSquare, Square, Send, Download, Sparkles, RefreshCw, ClipboardList, Briefcase, FileSignature, Inbox } from 'lucide-react';
import { cn } from '../lib/utils';
import { loadStripe } from '@stripe/stripe-js';
import { motion, AnimatePresence } from 'motion/react';

interface Client {
  uid: string;
  email: string;
  fullName: string;
  phone: string;
  avatarUrl: string;
  role: string;
  onboardingStep: number;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  plan_name: string | null;
  sub_status: string | null;
  amount: number | null;
  next_billing_date: string | null;
}

export default function AdminDashboard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [systemSettings, setSystemSettings] = useState<any>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'settings' | 'billing' | 'inbox' | 'marketing'>('overview');
  const { user, refreshProfile } = useAuth();
  const tenantId = user?.tenantId;

  // States for Daily Operations Panel
  const [opTab, setOpTab] = useState<'individual' | 'batch' | 'checklist'>('individual');
  const [manualTasks, setManualTasks] = useState([
    { id: 'mail', text: 'Credit Bureau Responses - Check mailbox for received outcome letters', completed: false },
    { id: 'scan', text: 'Audit Bureau Replies - Scan and upload returned mail to client records', completed: false },
    { id: 'disputes', text: 'Mail Active Disputes - Print and stamp all newly generated dispute letters', completed: true },
    { id: 'alerts', text: 'Send Client Status Updates - Email processed updates to dispute clients', completed: false }
  ]);
  const [batchProcessing, setBatchProcessing] = useState(false);

  useEffect(() => {
    fetchSystemSettings();
  }, []);

  const fetchSystemSettings = async () => {
    try {
      const response = await fetch('/api/admin/system-settings');
      const data = await response.json();
      setSystemSettings(data);
    } catch (error) {
      console.error("Failed to fetch system settings:", error);
    }
  };

  const handleSystemPay = async () => {
    setIsPaying(true);
    try {
      const response = await fetch('/api/admin/create-system-checkout', { method: 'POST' });
      const { url, error } = await response.json();
      
      if (error) {
        throw new Error(error);
      }

      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No checkout URL returned from server.");
      }
    } catch (error: any) {
      console.error("Payment failed:", error);
      alert("Payment initialization failed: " + error.message);
    } finally {
      setIsPaying(false);
    }
  };

  const handleManagePayment = async () => {
    setIsPaying(true);
    try {
      const response = await fetch('/api/admin/create-portal-session', { method: 'POST' });
      const { url, error } = await response.json();
      if (error) throw new Error(error);
      if (url) window.location.href = url;
    } catch (error: any) {
      console.error("Portal error:", error);
      alert("Failed to open billing portal: " + error.message);
    } finally {
      setIsPaying(false);
    }
  };

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const verifyPayment = async (sid: string) => {
      try {
        const response = await fetch('/api/admin/verify-system-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sid })
        });
        if (response.ok) {
          alert("System billing reactivated successfully!");
          fetchSystemSettings();
        } else {
          const error = await response.json();
          console.error("Payment verification failed:", error);
        }
      } catch (err) {
        console.error("Error verifying payment:", err);
      }
    };

    if (sessionId) {
      verifyPayment(sessionId);
    }
    
    if (searchParams.get('success') === 'true') {
      alert("System billing reactivated successfully!");
      fetchSystemSettings();
    }
  }, [searchParams]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'clients' || tab === 'settings' || tab === 'overview' || tab === 'billing' || tab === 'inbox' || tab === 'marketing') {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  useEffect(() => {
    if (tenantId) {
      fetchClients();
    }
  }, [tenantId]);

  const fetchClients = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/clients?tenantId=${tenantId}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setClients(data);
      } else {
        setClients([]);
      }
    } catch (error) {
      console.error("Failed to fetch clients:", error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const updateClientProgress = async (uid: string, newStep: number) => {
    setUpdatingId(uid);
    try {
      const response = await fetch(`/api/admin/clients/${uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboardingStep: newStep }),
      });
      if (response.ok) {
        setClients(clients.map(c => c.uid === uid ? { ...c, onboardingStep: newStep } : c));
      }
    } catch (error) {
      console.error("Update failed:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredClients = clients.filter(c => 
    c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    { label: 'Total MRR', value: `$${clients.reduce((acc, c) => acc + Number(c.amount || 0), 0).toFixed(2)}`, trend: 'Real-time', up: true },
    { label: 'Active Clients', value: clients.filter(c => c.sub_status === 'active').length.toString(), trend: '+3', up: true },
    { label: 'Total Registrations', value: clients.length.toString(), trend: 'Overall', up: true },
    { label: 'Processing', value: clients.filter(c => c.onboardingStep > 1 && c.onboardingStep < 5).length.toString(), trend: 'Active Work', up: true },
  ];

  const getStepLabel = (step: number) => {
    switch (step) {
      case 1: return 'Analysis Phase';
      case 2: return 'Dispute Letters';
      case 3: return 'Sent to Bureaus';
      case 4: return 'Verifying Results';
      case 5: return 'Completed';
      default: return 'Onboarding';
    }
  };

  const handleUpdateSettings = async (updates: any) => {
    try {
      const newSettings = { ...systemSettings, ...updates };
      const response = await fetch('/api/admin/system-settings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      if (response.ok) {
        setSystemSettings(newSettings);
      } else {
        const errData = await response.json().catch(() => ({}));
        alert("Failed to update settings: " + (errData.error || errData.message || response.statusText || "Unknown backend error"));
      }
    } catch (e: any) {
      console.error("Settings update failed:", e);
      alert("Settings update failed: " + e.message);
    }
  };

  return (
    <DashboardLayout>
      {systemSettings?.subscriptionStatus === 'expired' && (
        <div className="fixed inset-0 z-[200] bg-neutral-900/95 backdrop-blur-md flex items-center justify-center p-4">
           <div className="w-full max-w-md bg-white rounded-[32px] p-10 text-center shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="size-20 rounded-3xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-6">
                 <AlertCircle size={40} />
              </div>
              <h2 className="text-3xl font-bold font-display text-neutral-900 mb-4">System Locked</h2>
              <p className="text-neutral-500 mb-8 leading-relaxed">
                 Your platform subscription has expired. Please pay the monthly maintenance fee of $100 to reactivate all administrative features.
              </p>
              <button 
                onClick={handleSystemPay}
                disabled={isPaying}
                className="w-full rounded-2xl bg-neutral-900 py-4 font-bold text-white shadow-xl shadow-neutral-900/20 hover:bg-neutral-800 transition-all flex items-center justify-center gap-2"
              >
                {isPaying ? <Loader2 className="animate-spin" size={20} /> : <CreditCard size={20} />}
                Pay $100 & Reactivate
              </button>
              <p className="mt-6 text-[10px] text-neutral-400 uppercase font-bold tracking-widest flex items-center justify-center gap-1">
                 <MapPin size={10} /> Secure Enterprise Payment
              </p>
           </div>
        </div>
      )}
      <div className="space-y-8 max-w-7xl animate-in fade-in duration-500 text-left">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-4xl font-bold tracking-tight text-neutral-900">Admin Console</h1>
            <p className="text-neutral-500">Monitor system performance and manage client lifecycles.</p>
          </div>
          <button 
            onClick={fetchClients}
            className="flex items-center gap-2 rounded-xl bg-neutral-900 px-6 py-3 text-sm font-bold text-white shadow-xl transition-all hover:bg-neutral-800"
          >
             Refresh Data
             <RotateCcw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Search Params controlled sections */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm">
                  <p className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">{stat.label}</p>
                  <div className="mt-3 flex items-baseline justify-between transition-all">
                    <p className="text-2xl font-bold text-neutral-900 font-display">{stat.value}</p>
                    <div className={cn(
                      "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold",
                      stat.up ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                    )}>
                      {stat.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {stat.trend}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Daily Operations - Expanded Interactive Panel */}
            <div className="rounded-3xl border border-neutral-100 bg-white p-8 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-neutral-100 pb-6 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-3xl bg-amber-50 text-amber-600 border border-amber-100/50">
                      <Briefcase size={28} className="animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-display font-black text-2xl md:text-3xl lg:text-4xl text-neutral-900 leading-tight">Daily Operations Hub</h3>
                      <p className="text-base md:text-lg text-neutral-500 mt-1.5 font-medium">Track onboarding progress, process batches, and manage administrative tasks.</p>
                    </div>
                  </div>

                  {/* Operation Tabs */}
                  <div className="flex bg-neutral-100 p-1.5 rounded-2xl text-base font-bold shrink-0">
                    <button
                      onClick={() => setOpTab('individual')}
                      className={cn(
                        "px-5 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2.5",
                        opTab === 'individual' ? "bg-white text-neutral-900 shadow-md" : "text-neutral-500 hover:text-neutral-950"
                      )}
                    >
                      <User size={18} />
                      Individual Processing
                    </button>
                    <button
                      onClick={() => setOpTab('batch')}
                      className={cn(
                        "px-5 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2.5",
                        opTab === 'batch' ? "bg-white text-neutral-900 shadow-md" : "text-neutral-500 hover:text-neutral-950"
                      )}
                    >
                      <Sparkles size={18} />
                      Batch Actions ({clients.filter(c => c.onboardingStep === 1).length})
                    </button>
                    <button
                      onClick={() => setOpTab('checklist')}
                      className={cn(
                        "px-5 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2.5",
                        opTab === 'checklist' ? "bg-white text-neutral-900 shadow-md" : "text-neutral-500 hover:text-neutral-950"
                      )}
                    >
                      <ClipboardList size={18} />
                      Daily Checklist ({manualTasks.filter(t => t.completed).length}/{manualTasks.length})
                    </button>
                  </div>
                </div>

                {/* Tab Content: Individual Tasks */}
                {opTab === 'individual' && (
                  <div className="space-y-8">
                    {/* Step Categories */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      
                      {/* Section 1: Analysis Pending */}
                      <div className="rounded-3xl border border-neutral-100 bg-neutral-50/50 p-6 md:p-8 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-5">
                            <span className="text-base md:text-lg font-bold text-amber-700 bg-amber-50 px-4 py-2 rounded-full border border-amber-100 flex items-center gap-2">
                              <span className="size-2.5 rounded-full bg-amber-500 animate-ping" />
                              Step 1: Initial Analysis ({clients.filter(c => c.onboardingStep === 1).length})
                            </span>
                          </div>
                          <div className="space-y-4 max-h-64 overflow-y-auto mb-6 pr-1">
                            {clients.filter(c => c.onboardingStep === 1).length === 0 ? (
                              <p className="text-base md:text-lg text-neutral-400 italic py-8 text-center font-medium">No clients pending analysis.</p>
                            ) : (
                              clients.filter(c => c.onboardingStep === 1).map(c => (
                                <div key={c.uid} className="flex items-center justify-between bg-white border border-neutral-100 p-4 rounded-2xl shadow-sm">
                                  <div className="truncate pr-4">
                                    <p className="text-base md:text-lg font-extrabold text-neutral-900 truncate">{c.fullName}</p>
                                    <p className="text-sm md:text-base text-neutral-500 truncate mt-1">{c.email}</p>
                                  </div>
                                  <button
                                    onClick={() => updateClientProgress(c.uid, 2)}
                                    disabled={updatingId === c.uid}
                                    className="px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-bold hover:bg-neutral-800 transition-all cursor-pointer shrink-0 ml-2"
                                  >
                                    {updatingId === c.uid ? <Loader2 size={14} className="animate-spin" /> : 'Analyze'}
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                        <div className="border-t border-dashed border-neutral-200/60 pt-4 flex justify-between items-center text-sm md:text-base font-bold text-neutral-600">
                          <span>Action: Auto-analyze clients</span>
                          <span className="font-mono bg-neutral-100 px-3 py-1 rounded text-neutral-700 text-xs md:text-sm">Step: 1 → 2</span>
                        </div>
                      </div>

                      {/* Section 2: Dispute Mailing Queue */}
                      <div className="rounded-3xl border border-neutral-100 bg-neutral-50/50 p-6 md:p-8 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-5">
                            <span className="text-base md:text-lg font-bold text-blue-700 bg-blue-50 px-4 py-2 rounded-full border border-blue-100 flex items-center gap-2">
                              <span className="size-2.5 rounded-full bg-blue-500 animate-ping" />
                              Step 2: Dispute Mailing ({clients.filter(c => c.onboardingStep === 2).length})
                            </span>
                          </div>
                          <div className="space-y-4 max-h-64 overflow-y-auto mb-6 pr-1">
                            {clients.filter(c => c.onboardingStep === 2).length === 0 ? (
                              <p className="text-base md:text-lg text-neutral-400 italic py-8 text-center font-medium">No clients in mailing queue.</p>
                            ) : (
                              clients.filter(c => c.onboardingStep === 2).map(c => (
                                <div key={c.uid} className="flex items-center justify-between bg-white border border-neutral-100 p-4 rounded-2xl shadow-sm">
                                  <div className="truncate pr-4">
                                    <p className="text-base md:text-lg font-extrabold text-neutral-900 truncate">{c.fullName}</p>
                                    <p className="text-sm md:text-base text-neutral-500 truncate mt-1">{c.phone || c.email}</p>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => {
                                        alert(`Dispute letters for ${c.fullName} have been drafted! Please print and mail them via post.`);
                                      }}
                                      className="p-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-sm font-bold text-neutral-700 cursor-pointer flex items-center justify-center"
                                      title="Download Letter Drafts"
                                    >
                                      <Download size={14} />
                                    </button>
                                    <button
                                      onClick={() => updateClientProgress(c.uid, 3)}
                                      disabled={updatingId === c.uid}
                                      className="px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-bold hover:bg-neutral-800 transition-all cursor-pointer shrink-0"
                                    >
                                      {updatingId === c.uid ? <Loader2 size={14} className="animate-spin" /> : 'Mark Sent'}
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                        <div className="border-t border-dashed border-neutral-200/60 pt-4 flex justify-between items-center text-sm md:text-base font-bold text-neutral-600">
                          <span>Action: Submit letters directly to bureaus</span>
                          <span className="font-mono bg-neutral-100 px-3 py-1 rounded text-neutral-700 text-xs md:text-sm">Step: 2 → 3</span>
                        </div>
                      </div>

                      {/* Section 3: Sent to Bureaus */}
                      <div className="rounded-3xl border border-neutral-100 bg-neutral-50/50 p-6 md:p-8 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-5">
                            <span className="text-base md:text-lg font-bold text-indigo-700 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100 flex items-center gap-2">
                              <span className="size-2.5 rounded-full bg-indigo-500 animate-ping" />
                              Step 3: Bureau Processing ({clients.filter(c => c.onboardingStep === 3).length})
                            </span>
                          </div>
                          <div className="space-y-4 max-h-64 overflow-y-auto mb-6 pr-1">
                            {clients.filter(c => c.onboardingStep === 3).length === 0 ? (
                              <p className="text-base md:text-lg text-neutral-400 italic py-8 text-center font-medium">No files under bureau processing.</p>
                            ) : (
                              clients.filter(c => c.onboardingStep === 3).map(c => (
                                <div key={c.uid} className="flex items-center justify-between bg-white border border-neutral-100 p-4 rounded-2xl shadow-sm">
                                  <div className="truncate pr-4">
                                    <p className="text-base md:text-lg font-extrabold text-neutral-900 truncate">{c.fullName}</p>
                                    <p className="text-sm md:text-base text-emerald-600 font-bold font-mono mt-1">32 days elapsed</p>
                                  </div>
                                  <button
                                    onClick={() => updateClientProgress(c.uid, 4)}
                                    disabled={updatingId === c.uid}
                                    className="px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-bold hover:bg-neutral-800 transition-all cursor-pointer shrink-0 ml-2"
                                  >
                                    {updatingId === c.uid ? <Loader2 size={14} className="animate-spin" /> : 'Verify'}
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                        <div className="border-t border-dashed border-neutral-200/60 pt-4 flex justify-between items-center text-sm md:text-base font-bold text-neutral-600">
                          <span>Action: Track bureaus and review outcomes</span>
                          <span className="font-mono bg-neutral-100 px-3 py-1 rounded text-neutral-700 text-xs md:text-sm">Step: 3 → 4</span>
                        </div>
                      </div>

                      {/* Section 4: Result Verifications */}
                      <div className="rounded-3xl border border-neutral-100 bg-neutral-50/50 p-6 md:p-8 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-5">
                            <span className="text-base md:text-lg font-bold text-purple-700 bg-purple-50 px-4 py-2 rounded-full border border-purple-100 flex items-center gap-2">
                              <span className="size-2.5 rounded-full bg-purple-500 animate-ping" />
                              Step 4: Final Check & Credit Results ({clients.filter(c => c.onboardingStep === 4).length})
                            </span>
                          </div>
                          <div className="space-y-4 max-h-64 overflow-y-auto mb-6 pr-1">
                            {clients.filter(c => c.onboardingStep === 4).length === 0 ? (
                              <p className="text-base md:text-lg text-neutral-400 italic py-8 text-center font-medium">No final checks pending result upload.</p>
                            ) : (
                              clients.filter(c => c.onboardingStep === 4).map(c => (
                                <div key={c.uid} className="flex items-center justify-between bg-white border border-neutral-100 p-4 rounded-2xl shadow-sm">
                                  <div className="truncate pr-4">
                                    <p className="text-base md:text-lg font-extrabold text-neutral-900 truncate">{c.fullName}</p>
                                    <p className="text-sm md:text-base text-purple-600 font-semibold mt-1">{c.plan_name || 'Subscriber'}</p>
                                  </div>
                                  <button
                                    onClick={() => updateClientProgress(c.uid, 5)}
                                    disabled={updatingId === c.uid}
                                    className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-all cursor-pointer shrink-0 ml-2"
                                  >
                                    {updatingId === c.uid ? <Loader2 size={14} className="animate-spin" /> : 'Close Case'}
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                        <div className="border-t border-dashed border-neutral-200/60 pt-4 flex justify-between items-center text-sm md:text-base font-bold text-neutral-600">
                          <span>Action: Complete and update customer credit report</span>
                          <span className="font-mono bg-neutral-100 px-3 py-1 rounded text-neutral-700 text-xs md:text-sm">Step: 4 → 5</span>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* Tab Content: Batch Actions */}
                {opTab === 'batch' && (
                  <div className="p-10 bg-neutral-50 rounded-3xl border border-neutral-100 text-center space-y-6">
                    <div className="mx-auto size-20 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-600 border border-amber-100">
                      <Sparkles size={40} className={batchProcessing ? "animate-spin" : ""} />
                    </div>
                    <div>
                      <h4 className="text-xl md:text-2xl font-black text-neutral-900">Smart Batch Processing & Letter Generation</h4>
                      <p className="text-base md:text-lg text-neutral-500 mt-3 max-w-2xl mx-auto leading-relaxed font-medium">
                        Analyze all pending clients in Step 1 in a single click, generate intelligent dispute letters, and move them directly to the mailing queue (Step 2).
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-4">
                      <button
                        disabled={batchProcessing || clients.filter(c => c.onboardingStep === 1).length === 0}
                        onClick={async () => {
                          const pending = clients.filter(c => c.onboardingStep === 1);
                          if (pending.length === 0) {
                            alert("No clients pending analysis.");
                            return;
                          }
                          setBatchProcessing(true);
                          try {
                            for (const client of pending) {
                              await fetch(`/api/admin/clients/${client.uid}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ onboardingStep: 2 }),
                              });
                            }
                            setClients(prev => prev.map(c => c.onboardingStep === 1 ? { ...c, onboardingStep: 2 } : c));
                            alert("Successfully completed analysis and generated dispute letters for all clients!");
                          } catch (err: any) {
                            alert("Error: " + err.message);
                          } finally {
                            setBatchProcessing(false);
                          }
                        }}
                        className="rounded-2xl px-8 py-4.5 font-bold text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 disabled:hover:bg-neutral-900 shadow-lg shadow-neutral-900/10 flex items-center justify-center gap-3 cursor-pointer w-full sm:w-auto text-base md:text-lg"
                      >
                        {batchProcessing ? <Loader2 size={22} className="animate-spin" /> : <RefreshCw size={22} />}
                        Analyze all pending clients ({clients.filter(c => c.onboardingStep === 1).length})
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          alert("Downloading a consolidated PDF of all dispute letters for today...");
                        }}
                        className="rounded-2xl border border-neutral-200 bg-white hover:bg-neutral-50 px-8 py-4.5 font-bold text-neutral-700 text-base md:text-lg flex items-center justify-center gap-3 cursor-pointer w-full sm:w-auto"
                      >
                        <Download size={22} />
                        Download Consolidated Mailing Batch (PDF)
                      </button>
                    </div>
                  </div>
                )}

                {/* Tab Content: Checklist */}
                {opTab === 'checklist' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between text-base md:text-lg font-extrabold text-neutral-600 mb-1">
                      <span>Administrative Actions Checklist</span>
                      <span className="text-neutral-900 font-mono text-base md:text-lg font-bold">
                        {manualTasks.filter(t => t.completed).length}/{manualTasks.length} Completed
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-4 w-full bg-neutral-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${(manualTasks.filter(t => t.completed).length / manualTasks.length) * 100}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3">
                      {manualTasks.map(task => (
                        <div 
                          key={task.id} 
                          onClick={() => {
                            setManualTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t));
                          }}
                          className={cn(
                            "p-5 rounded-2xl border transition-all cursor-pointer flex items-start gap-4",
                            task.completed 
                              ? "bg-emerald-50/40 border-emerald-100 text-neutral-400" 
                              : "bg-white border-neutral-150 text-neutral-800 hover:border-neutral-300 shadow-sm"
                          )}
                        >
                          <div className="mt-1 text-neutral-400 shrink-0">
                            {task.completed ? (
                              <CheckSquare size={22} className="text-emerald-500" />
                            ) : (
                              <Square size={22} />
                            )}
                          </div>
                          <div>
                            <p className={cn("text-base md:text-lg font-extrabold leading-relaxed", task.completed && "line-through text-neutral-400")}>
                              {task.text}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

            </div>
          </div>
        )}

        {activeTab === 'clients' && (
          <div className="animate-in fade-in duration-500">
            {/* Client Table */}
            <div className="rounded-3xl border border-neutral-100 bg-white shadow-sm overflow-hidden min-h-[400px]">
              <div className="border-b border-neutral-100 p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                 <h3 className="font-display text-xl font-bold text-neutral-900">Client Management</h3>
                 <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                      <input 
                        type="text" 
                        placeholder="Search name or email..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="rounded-xl border border-neutral-200 bg-neutral-50 pl-9 pr-4 py-2 text-xs outline-none focus:border-neutral-900 w-64" 
                      />
                    </div>
                    <button className="rounded-xl border border-neutral-200 p-2 text-neutral-500 hover:bg-neutral-50"><Filter size={16} /></button>
                 </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-50/50 text-xs font-bold uppercase tracking-wider text-neutral-400">
                      <th className="px-6 py-4">Client Info</th>
                      <th className="px-6 py-4">Active Plan</th>
                      <th className="px-6 py-4">Subscription</th>
                      <th className="px-6 py-4">Service Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-sm">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="animate-spin text-neutral-900" size={32} />
                            <p className="text-neutral-500 font-bold">Fetching latest data...</p>
                          </div>
                        </td>
                      </tr>
                    ) : filteredClients.map((client) => (
                      <tr key={client.uid} className="group hover:bg-neutral-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                             <div className="size-10 rounded-xl bg-neutral-100 flex items-center justify-center border border-neutral-200 overflow-hidden shadow-sm">
                                {client.avatarUrl ? (
                                  <img src={client.avatarUrl} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-neutral-900 font-display font-bold uppercase text-xs">
                                    {client.fullName.split(' ').map(n => n[0]).join('')}
                                  </span>
                                )}
                             </div>
                             <div className="flex flex-col">
                                <span className="font-bold text-neutral-900">{client.fullName}</span>
                                <span className="text-xs text-neutral-500">{client.email}</span>
                             </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-neutral-900">{client.plan_name || 'No Active Plan'}</p>
                          {client.amount && <p className="text-xs text-neutral-500">${client.amount}/mo</p>}
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-tight",
                            client.sub_status === 'active' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                            "bg-red-50 text-red-600 border border-red-100"
                          )}>
                            {client.sub_status || 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <select 
                              value={client.onboardingStep}
                              onChange={(e) => updateClientProgress(client.uid, parseInt(e.target.value))}
                              disabled={updatingId === client.uid}
                              className="bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1 text-xs font-bold text-neutral-900 focus:border-neutral-900 outline-none disabled:opacity-50"
                            >
                              <option value={1}>1. Analysis</option>
                              <option value={2}>2. Disputing</option>
                              <option value={3}>3. Processing</option>
                              <option value={4}>4. Final Check</option>
                              <option value={5}>5. Completed</option>
                            </select>
                            {updatingId === client.uid && <Loader2 size={12} className="animate-spin text-neutral-400" />}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <div className="flex justify-end gap-2">
                             <button 
                               onClick={() => setSelectedClient(client)}
                               className="text-xs font-bold text-neutral-900 bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded-lg transition-colors"
                             >
                               View Details
                             </button>
                             <button className="text-neutral-400 hover:text-neutral-900 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
                                <MoreHorizontal size={18} />
                             </button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!loading && filteredClients.length === 0 && (
                <div className="p-12 text-center text-neutral-500">
                   No clients found matching your search.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-3xl border border-neutral-100 p-8 shadow-sm animate-in fade-in duration-500">
            <h3 className="text-xl font-bold mb-4 font-display">Administrative Settings</h3>
            <div className="space-y-6">
                <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-100">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-neutral-700">Application Name (Branding)</label>
                    {updatingId === 'systemName' && <span className="text-[10px] text-emerald-500 font-bold animate-pulse">SAVING...</span>}
                  </div>
                  <input 
                    type="text" 
                    value={systemSettings?.systemName || ''}
                    onChange={(e) => setSystemSettings({ ...systemSettings, systemName: e.target.value })}
                    onBlur={async (e) => {
                      setUpdatingId('systemName');
                      await handleUpdateSettings({ systemName: e.target.value });
                      setUpdatingId(null);
                    }}
                    className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-neutral-900 transition-all font-medium"
                    placeholder="FTF Consulting"
                  />
                  <p className="text-[10px] text-neutral-400 mt-2 font-bold uppercase tracking-wider">Updates browser tab and dashboards instantly</p>
                </div>

                {/* Logo Upload Section */}
                <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-100">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-neutral-700">Application Logo</label>
                    {updatingId === 'systemLogo' && <span className="text-[10px] text-emerald-500 font-bold animate-pulse">SAVING...</span>}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    {/* Logo Preview Container */}
                    <div className="size-20 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center overflow-hidden shrink-0 relative group shadow-inner">
                      {systemSettings?.systemLogo ? (
                        <img 
                          src={systemSettings.systemLogo} 
                          alt="App Logo Preview" 
                          className="w-full h-full object-contain p-2" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="text-center p-2">
                          <span className="text-[10px] font-bold text-neutral-400 capitalize">No Logo</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {/* Hidden File Input */}
                        <label className="cursor-pointer bg-neutral-900 border border-transparent rounded-xl px-4 py-2.5 text-xs font-bold text-white hover:bg-neutral-800 transition-all shadow-sm shrink-0 flex items-center gap-1.5">
                          <span>Choose Logo Image File</span>
                          <input 
                            type="file" 
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 2 * 1024 * 1024) {
                                  alert("Image size must be less than 2MB");
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onloadend = async () => {
                                  const base64String = reader.result as string;
                                  setUpdatingId('systemLogo');
                                  await handleUpdateSettings({ systemLogo: base64String });
                                  setUpdatingId(null);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>

                        {systemSettings?.systemLogo && (
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm("Are you sure you want to remove the logo?")) {
                                setUpdatingId('systemLogo');
                                await handleUpdateSettings({ systemLogo: null });
                                setUpdatingId(null);
                              }
                            }}
                            className="bg-white border border-neutral-200 hover:border-red-200 hover:text-red-600 rounded-xl px-4 py-2.5 text-xs font-bold text-neutral-700 transition-all shadow-sm shrink-0"
                          >
                            Remove Logo
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                        Supports PNG, JPG, or SVG up to 2MB. Logo updates will be applied instantly.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-neutral-50 rounded-[32px] border border-neutral-100 mt-8">
                  <h4 className="text-lg font-bold mb-6 font-display">Agency Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-neutral-600 ml-1">Admin Full Name</label>
                      <input 
                        type="text" 
                        defaultValue={user?.fullName || ''}
                        key={user?.fullName}
                        id="fullName"
                        autoComplete="name"
                        className="w-full bg-white border border-neutral-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-neutral-900 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-neutral-600 ml-1">Company / Agency Name</label>
                      <input 
                        type="text" 
                        defaultValue={user?.agencyName || ''}
                        key={user?.agencyName}
                        id="agencyName"
                        autoComplete="organization"
                        className="w-full bg-white border border-neutral-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-neutral-900 transition-all font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-neutral-600 ml-1">Email Address</label>
                      <input 
                        type="email" 
                        defaultValue={user?.email || ''}
                        key={user?.email}
                        id="email"
                        autoComplete="email"
                        className="w-full bg-white border border-neutral-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-neutral-900 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-neutral-600 ml-1">Phone Number</label>
                      <input 
                        type="text" 
                        defaultValue={user?.phone || ''}
                        key={user?.phone}
                        id="phone"
                        autoComplete="tel"
                        className="w-full bg-white border border-neutral-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-neutral-900 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-neutral-600 ml-1">Office Address</label>
                      <input 
                        type="text" 
                        defaultValue={user?.streetAddress || ''}
                        key={user?.streetAddress}
                        id="streetAddress"
                        autoComplete="street-address"
                        className="w-full bg-white border border-neutral-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-neutral-900 transition-all"
                      />
                    </div>
                  </div>
                  <div className="mt-8 flex justify-end">
                    <button 
                      onClick={async () => {
                        const updates = {
                          uid: user?.uid,
                          fullName: (document.getElementById('fullName') as HTMLInputElement).value,
                          agencyName: (document.getElementById('agencyName') as HTMLInputElement).value,
                          email: (document.getElementById('email') as HTMLInputElement).value,
                          phone: (document.getElementById('phone') as HTMLInputElement).value,
                          streetAddress: (document.getElementById('streetAddress') as HTMLInputElement).value,
                        };
                        try {
                          const res = await fetch('/api/admin/agency-settings/update', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(updates),
                          });
                          if (res.ok) {
                            await refreshProfile();
                            alert("Agency settings saved successfully!");
                            window.location.reload(); // Refresh to apply branding
                          }
                        } catch (e) {
                          alert("Save failed");
                        }
                      }}
                      className="bg-neutral-900 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
                    >
                      Save Agency Details
                    </button>
                  </div>
                </div>

                {/* Stripe Connect Section */}
                <StripeConnectSection user={user} />

                {/* Client Subscription Pricing Configuration */}
                <div className="p-8 bg-neutral-50 rounded-[32px] border border-neutral-100 mt-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h4 className="text-lg font-bold font-display text-neutral-900">ক্লায়েন্ট সাবস্ক্রিপশন প্ল্যানের মূল্য নির্ধারণ (Pricing)</h4>
                      <p className="text-xs text-neutral-500">এখানে যে এমাউন্ট বসাবেন, ক্লায়েন্ট ড্যাশবোর্ডে প্ল্যানের মূল্য সেটিই দেখাবে এবং সেই এমাউন্টটি চার্জ হবে।</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="space-y-2 bg-white p-5 rounded-2xl border border-neutral-150">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-extrabold text-neutral-600 uppercase tracking-widest">Standard Plan</label>
                        {updatingId === 'planPriceStandard' && <span className="text-[9px] text-emerald-500 font-bold animate-pulse">SAVING...</span>}
                      </div>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-neutral-400">$</span>
                        <input 
                          type="number" 
                          min="1"
                          step="1"
                          value={systemSettings?.planPriceStandard !== undefined ? systemSettings.planPriceStandard : 99}
                          onChange={(e) => setSystemSettings({ ...systemSettings, planPriceStandard: e.target.value })}
                          onBlur={async (e) => {
                            setUpdatingId('planPriceStandard');
                            await handleUpdateSettings({ planPriceStandard: Math.max(1, parseFloat(e.target.value) || 99) });
                            setUpdatingId(null);
                          }}
                          className="w-full pl-8 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-neutral-900 transition-all font-bold text-neutral-900"
                        />
                      </div>
                      <p className="text-[10px] text-neutral-400 font-medium italic">Standard Credit Repair</p>
                    </div>

                    <div className="space-y-2 bg-white p-5 rounded-2xl border border-neutral-150">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-extrabold text-neutral-600 uppercase tracking-widest">Premium Plan</label>
                        {updatingId === 'planPricePremium' && <span className="text-[9px] text-emerald-500 font-bold animate-pulse">SAVING...</span>}
                      </div>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-neutral-400">$</span>
                        <input 
                          type="number" 
                          min="1"
                          step="1"
                          value={systemSettings?.planPricePremium !== undefined ? systemSettings.planPricePremium : 149}
                          onChange={(e) => setSystemSettings({ ...systemSettings, planPricePremium: e.target.value })}
                          onBlur={async (e) => {
                            setUpdatingId('planPricePremium');
                            await handleUpdateSettings({ planPricePremium: Math.max(1, parseFloat(e.target.value) || 149) });
                            setUpdatingId(null);
                          }}
                          className="w-full pl-8 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-neutral-900 transition-all font-bold text-neutral-900"
                        />
                      </div>
                      <p className="text-[10px] text-neutral-400 font-medium italic">Premium Credit Repair</p>
                    </div>

                    <div className="space-y-2 bg-white p-5 rounded-2xl border border-neutral-150">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-extrabold text-neutral-600 uppercase tracking-widest">Elite Plan</label>
                        {updatingId === 'planPriceElite' && <span className="text-[9px] text-emerald-500 font-bold animate-pulse">SAVING...</span>}
                      </div>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-neutral-400">$</span>
                        <input 
                          type="number" 
                          min="1"
                          step="1"
                          value={systemSettings?.planPriceElite !== undefined ? systemSettings.planPriceElite : 299}
                          onChange={(e) => setSystemSettings({ ...systemSettings, planPriceElite: e.target.value })}
                          onBlur={async (e) => {
                            setUpdatingId('planPriceElite');
                            await handleUpdateSettings({ planPriceElite: Math.max(1, parseFloat(e.target.value) || 299) });
                            setUpdatingId(null);
                          }}
                          className="w-full pl-8 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-neutral-900 transition-all font-bold text-neutral-900"
                        />
                      </div>
                      <p className="text-[10px] text-neutral-400 font-medium italic">Elite Credit Sweep</p>
                    </div>
                  </div>
                </div>

               <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-100 mt-8">
                 <div>
                   <p className="font-bold">System Maintenance Mode</p>
                   <p className="text-xs text-neutral-500">Prevent client access during updates.</p>
                 </div>
                 <button 
                  onClick={() => handleUpdateSettings({ maintenanceMode: !systemSettings?.maintenanceMode })}
                  className={cn(
                   "h-6 w-11 rounded-full p-1 transition-colors relative",
                   systemSettings?.maintenanceMode ? "bg-neutral-900" : "bg-neutral-200"
                  )}
                 >
                   <div className={cn(
                     "size-4 bg-white rounded-full transition-transform",
                     systemSettings?.maintenanceMode ? "translate-x-5" : "translate-x-0"
                   )} />
                 </button>
               </div>
               <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                 <div>
                   <p className="font-bold">Automated Email Alerts</p>
                   <p className="text-xs text-neutral-500">Notify clients on progress updates automatically.</p>
                 </div>
                 <button 
                  onClick={() => handleUpdateSettings({ emailAlerts: !systemSettings?.emailAlerts })}
                  className={cn(
                   "h-6 w-11 rounded-full p-1 transition-colors relative",
                   systemSettings?.emailAlerts ? "bg-neutral-900" : "bg-neutral-200"
                  )}
                 >
                   <div className={cn(
                     "size-4 bg-white rounded-full transition-transform",
                     systemSettings?.emailAlerts ? "translate-x-5" : "translate-x-0"
                   )} />
                 </button>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="animate-in fade-in duration-500 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="md:col-span-2 bg-white rounded-[32px] border border-neutral-100 p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                     <h3 className="text-xl font-bold font-display text-neutral-900">Platform Subscription</h3>
                     <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-3 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
                        Enterprise License
                     </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                     <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-100">
                        <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Subscription Fee</p>
                        <p className="text-3xl font-bold text-neutral-900 font-display">$100<span className="text-sm text-neutral-400">/month</span></p>
                     </div>
                     <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-100">
                        <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Next Payment</p>
                        <p className="text-lg font-bold text-neutral-900">
                          {systemSettings?.expiryDate ? new Date(systemSettings.expiryDate).toLocaleDateString() : 'N/A'}
                        </p>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <p className="text-sm font-bold text-neutral-900 mb-4">Payment Method</p>
                     <div className="flex items-center justify-between p-6 rounded-2xl border-2 border-neutral-900 bg-neutral-50/50">
                        <div className="flex items-center gap-4">
                           <div className="size-12 rounded-xl bg-neutral-900 flex items-center justify-center text-white">
                              <CreditCard size={24} />
                           </div>
                           <div>
                              <p className="font-bold text-neutral-900">Secure Payment via Stripe</p>
                              <p className="text-xs text-neutral-400">Live integration for system billing</p>
                           </div>
                        </div>
                        <div className="text-emerald-500">
                           <ShieldCheck size={24} />
                        </div>
                     </div>
                     <button 
                        onClick={handleManagePayment}
                        disabled={isPaying}
                        className="w-full rounded-2xl border border-neutral-200 py-4 font-bold text-neutral-900 hover:bg-neutral-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mb-3"
                     >
                        {isPaying ? <Loader2 className="animate-spin" size={18} /> : 'Manage / Add Payment Method'}
                     </button>
                     <button 
                      onClick={handleSystemPay}
                      disabled={isPaying || systemSettings?.subscriptionStatus === 'active'}
                      className="w-full rounded-2xl bg-neutral-900 py-4 font-bold text-white hover:bg-neutral-800 shadow-xl shadow-neutral-900/10 transition-all flex items-center justify-center gap-2 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:shadow-none"
                     >
                        {isPaying ? <Loader2 className="animate-spin" size={18} /> : (systemSettings?.subscriptionStatus === 'active' ? 'Subscription Active' : 'Renew with Stripe')}
                     </button>
                     <p className="text-[10px] text-center text-neutral-400 font-bold uppercase tracking-widest">
                        Redirects to Stripe Secure Checkout
                     </p>
                  </div>
               </div>

               <div className="bg-neutral-900 rounded-[32px] p-8 text-white flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-4 font-display">Ad Payments & Billing</h3>
                    <p className="text-neutral-400 text-sm leading-relaxed mb-6 font-semibold">
                       All payments for system subscriptions and paid Facebook/Instagram ad campaigns are securely processed in real-time Live Mode using the unified Stripe Checkout API key.
                    </p>
                    <ul className="space-y-3">
                       {[
                         'Stripe Live Mode API: Active',
                         'Paid Ad Campaigns Sync: Enabled',
                         'Dispute Marketing Budget: Integrated',
                         'Stripe Connector Core: Same API Key'
                       ].map(item => (
                         <li key={item} className="flex items-center gap-2 text-xs font-semibold">
                            <div className="size-1.5 rounded-full bg-emerald-400"></div>
                            {item}
                         </li>
                       ))}
                    </ul>
                  </div>
                  <div className="mt-8 pt-6 border-t border-white/10">
                     <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1">Stripe Status Monitor</p>
                     <p className={cn(
                       "font-bold text-xs uppercase tracking-wider flex items-center gap-1.5",
                       systemSettings?.subscriptionStatus === 'active' ? "text-emerald-400" : "text-yellow-400"
                     )}>
                        <span className="size-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Syncing with Primary Stripe Gateway
                     </p>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'inbox' && (
          <AdminInbox />
        )}

        {activeTab === 'marketing' && (
          <AdminMarketing />
        )}

        {/* Client Detail Modal */}
        {selectedClient && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-white rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="relative h-32 bg-neutral-900 p-8">
                <button 
                  onClick={() => setSelectedClient(null)}
                  className="absolute right-6 top-6 text-white/50 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
                <div className="absolute -bottom-12 left-8">
                  <div className="size-24 rounded-3xl bg-white p-1 shadow-xl">
                    <div className="w-full h-full rounded-2xl bg-neutral-100 flex items-center justify-center border border-neutral-100 overflow-hidden">
                      {selectedClient.avatarUrl ? (
                        <img src={selectedClient.avatarUrl} className="w-full h-full object-cover" />
                      ) : (
                        <User size={40} className="text-neutral-300" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-16 p-8 space-y-8">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-neutral-900 font-display">{selectedClient.fullName}</h2>
                    <p className="text-neutral-500 font-medium">User ID: {selectedClient.uid}</p>
                  </div>
                  <span className={cn(
                    "inline-flex items-center rounded-full px-4 py-1 text-xs font-bold uppercase tracking-wider",
                    selectedClient.sub_status === 'active' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                    "bg-red-50 text-red-600 border border-red-100"
                  )}>
                    {selectedClient.sub_status || 'Inactive'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-neutral-600">
                      <div className="size-8 rounded-lg bg-neutral-50 flex items-center justify-center text-neutral-400">
                        <Mail size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Email Address</p>
                        <p className="font-medium">{selectedClient.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-neutral-600">
                      <div className="size-8 rounded-lg bg-neutral-50 flex items-center justify-center text-neutral-400">
                        <Phone size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Phone Number</p>
                        <p className="font-medium">{selectedClient.phone || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-neutral-600">
                      <div className="size-8 rounded-lg bg-neutral-50 flex items-center justify-center text-neutral-400">
                        <CreditCard size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Active Plan</p>
                        <p className="font-medium font-display">{selectedClient.plan_name || 'No Plan Selected'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-neutral-600">
                      <div className="size-8 rounded-lg bg-neutral-50 flex items-center justify-center text-neutral-400">
                        <Calendar size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Next Billing</p>
                        <p className="font-medium">{selectedClient.next_billing_date ? new Date(selectedClient.next_billing_date).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address Section */}
                <div className="pt-6 border-t border-neutral-100">
                  <div className="flex items-start gap-4">
                    <div className="size-10 rounded-xl bg-neutral-50 flex items-center justify-center text-neutral-400">
                      <MapPin size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-1">Residence Address</p>
                      {selectedClient.streetAddress ? (
                        <div className="text-sm font-bold text-neutral-900 leading-relaxed">
                          <p>{selectedClient.streetAddress}</p>
                          <p>{selectedClient.city}, {selectedClient.state} {selectedClient.zipCode}</p>
                        </div>
                      ) : (
                        <p className="text-sm italic text-neutral-400">No address provided</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-neutral-100 flex items-center justify-between">
                   <div>
                      <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-1">Current Progress</p>
                      <p className="text-sm font-bold text-neutral-900">{getStepLabel(selectedClient.onboardingStep)}</p>
                   </div>
                   <button 
                    onClick={() => setSelectedClient(null)}
                    className="rounded-xl border border-neutral-200 px-6 py-2.5 text-sm font-bold text-neutral-900 hover:bg-neutral-50 transition-colors"
                   >
                     Close
                   </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function StripeConnectSection({ user }: { user: any }) {
  const [connectStatus, setConnectStatus] = useState<{ isConnected: boolean; stripeAccountId: string | null; isManual?: boolean } | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      fetch(`/api/admin/stripe/status?uid=${user.uid}`)
        .then(res => res.json())
        .then(data => setConnectStatus(data))
        .catch(console.error);
    }
  }, [user]);

  const handleConnect = async () => {
    if (connectStatus?.isManual) {
      // If it is a manual standalone account, direct them to their Stripe Dashboard
      window.open("https://dashboard.stripe.com", "_blank");
      return;
    }

    setConnecting(true);
    try {
      const response = await fetch('/api/admin/stripe/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, email: user.email }),
      });
      const data = await response.json();
      
      if (data.error) {
        // Show specific guidance for platform profile error
        if (data.error.includes("Platform Profile") || data.error.includes("platform profile")) {
          alert("Platform Setup Needed:\n\n" + data.error + "\n\nOnce filled, click 'Connect' again.");
        } else if (data.error.includes("signed up for Connect")) {
          alert("Action Required: Please enable 'Stripe Connect' in your Stripe Dashboard (dashboard.stripe.com/connect) first, then try again.");
        } else {
          alert("Connection Error: " + data.error + (data.suggestion ? "\n\nSuggestion: " + data.suggestion : ""));
        }
        return;
      }
      
      if (data.url) window.location.href = data.url;
    } catch (e: any) {
      alert("Connection failed: " + e.message);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="p-8 bg-neutral-50 rounded-[32px] border border-neutral-100 mt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h4 className="text-lg font-bold font-display text-neutral-900">Payment Integration</h4>
          <p className="text-xs text-neutral-500">Connect your Stripe account to receive payments from your clients.</p>
        </div>
        {connectStatus?.isConnected ? (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl border border-emerald-100 text-xs font-bold">
            <CheckCircle2 size={16} />
            STRIPE CONNECTED {connectStatus?.isManual && "(MANUAL)"}
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-amber-50 text-amber-600 px-4 py-2 rounded-xl border border-amber-100 text-xs font-bold">
            <AlertCircle size={16} />
            STRIPE NOT CONNECTED
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-neutral-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-xl bg-neutral-900 flex items-center justify-center text-white">
            <CreditCard size={24} />
          </div>
          <div>
            <p className="font-bold text-neutral-900">Stripe Connect Account</p>
            <p className="text-xs text-neutral-400">
              {connectStatus?.isConnected 
                ? `Account ID: ${connectStatus.stripeAccountId}`
                : "Redirects to Stripe for verification"}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <button
            onClick={handleConnect}
            disabled={connecting}
            className={cn(
              "rounded-xl px-6 py-3 text-sm font-bold transition-all flex items-center gap-2 cursor-pointer",
              connectStatus?.isConnected
                ? "bg-neutral-100 text-neutral-900 hover:bg-neutral-200"
                : "bg-neutral-900 text-white hover:bg-neutral-800 shadow-lg shadow-neutral-900/10"
            )}
          >
            {connecting ? <Loader2 className="animate-spin" size={18} /> : null}
            {connectStatus?.isConnected 
              ? (connectStatus?.isManual ? "Go to Stripe Dashboard" : "Manage Stripe Account") 
              : "Automatic Connect (Recommended)"}
            {!connecting && <ArrowUpRight size={18} />}
          </button>

          {connectStatus?.isConnected && (
            <button
              onClick={async () => {
                if (window.confirm("Are you sure you want to disconnect this Stripe account? This will stop receiving client payments.")) {
                  setConnecting(true);
                  try {
                    const res = await fetch('/api/admin/update-settings', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ uid: user.uid, updates: { stripeAccountId: "" } }),
                    });
                    if (res.ok) {
                      alert("Stripe Account disconnected successfully!");
                      window.location.reload();
                    }
                  } catch (e: any) {
                    alert("Failed to disconnect: " + e.message);
                  } finally {
                    setConnecting(false);
                  }
                }
              }}
              className="text-xs text-red-500 font-bold hover:text-red-700 hover:underline transition-all text-center md:text-right cursor-pointer"
            >
              Disconnect Stripe Account
            </button>
          )}
          
          {!connectStatus?.isConnected && (
            <div className="flex items-center gap-2">
              <input 
                type="text"
                placeholder="Alternative: Paste Account ID (acct_...)"
                id="manualStripeId"
                className="text-[10px] bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-neutral-900 w-full min-w-[200px]"
              />
              <button 
                onClick={async () => {
                  const id = (document.getElementById('manualStripeId') as HTMLInputElement).value;
                  if (!id.startsWith('acct_')) return alert("Invalid Account ID. Must start with acct_");
                  setConnecting(true);
                  try {
                    const res = await fetch('/api/admin/update-settings', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ uid: user.uid, updates: { stripeAccountId: id } }),
                    });
                    if (res.ok) {
                      alert("Stripe ID saved manually! Please ensure this account is fully verified on Stripe.");
                      window.location.reload();
                    }
                  } catch (e) {} finally { setConnecting(false); }
                }}
                className="bg-neutral-200 text-neutral-700 px-3 py-2 rounded-lg text-[10px] font-bold hover:bg-neutral-300 cursor-pointer"
              >
                SAVE
              </button>
            </div>
          )}
        </div>
      </div>
      
      {!connectStatus?.isConnected && (
        <p className="mt-4 text-[10px] text-neutral-400 uppercase font-bold tracking-widest text-center">
          Note: You must complete onboarding to receive client payments.
        </p>
      )}
    </div>
  );
}
