import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, ShieldCheck, Loader2, CreditCard, 
  Settings, Users, BarChart, Briefcase, Building, 
  GraduationCap, Bot, Smartphone, Lock, UserCheck, CheckCircle2 
} from 'lucide-react';
import { cn } from '../lib/utils';

// Import our custom business suites
import FtfCreditRepair from '../components/FtfCreditRepair';
import FtfFundingModule from '../components/FtfFundingModule';
import FtfFormationTaxImmigration from '../components/FtfFormationTaxImmigration';
import FtfEducationSimulator from '../components/FtfEducationSimulator';
import FtfAiAssistant from '../components/FtfAiAssistant';
import FtfCrmSimulator from '../components/FtfCrmSimulator';
import FtfSecurityHub from '../components/FtfSecurityHub';

export default function ClientDashboard() {
  const { user, refreshProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Set default tab to credit repair
  const activeTab = searchParams.get('tab') || 'credit';

  // --- LOCAL BILLING STATES (Preserved for Stripe Payments integrations) ---
  const [plans] = useState([
    { name: 'Standard Plan', price: 99, features: ['Core App Engine', 'Basic Analytics', 'Standard DB Operations', 'E-mail Support'] },
    { name: 'Premium Plan', price: 149, features: ['Advanced Features', 'Live Real-time Events', 'Premium Automation', 'Priority Support'] },
    { name: 'Elite Plan', price: 299, features: ['Unlimited Resource Quota', 'Custom Hostname Branding', 'Direct Stripe Billing', 'Dedicated Account Executive'] }
  ]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [subscribingLoader, setSubscribingLoader] = useState(false);

  // --- LOCAL PROFILE FORM STATES ---
  const [profileName, setProfileName] = useState(user?.fullName || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileAddress, setProfileAddress] = useState(user?.streetAddress || '');
  const [profileCity, setProfileCity] = useState(user?.city || '');
  const [profileState, setProfileState] = useState(user?.state || '');
  const [profileZip, setProfileZip] = useState(user?.zipCode || '');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileName(user.fullName || '');
      setProfilePhone(user.phone || '');
      setProfileAddress(user.streetAddress || '');
      setProfileCity(user.city || '');
      setProfileState(user.state || '');
      setProfileZip(user.zipCode || '');
    }
  }, [user]);

  useEffect(() => {
    if (user?.uid) {
      fetchPaymentHistory();
    }
  }, [user?.uid]);

  const fetchPaymentHistory = async () => {
    if (!user?.uid) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/users/${user.uid}/payments`);
      if (res.ok) {
        setPaymentHistory(await res.json());
      }
    } catch (e) {
      console.error("Failed to load payment history:", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;
    setSavingProfile(true);
    try {
      const res = await fetch(`/api/users/${user.uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: profileName,
          phone: profilePhone,
          streetAddress: profileAddress,
          city: profileCity,
          state: profileState,
          zipCode: profileZip,
          email: user.email
        })
      });
      if (res.ok) {
        await refreshProfile();
        alert("Personal profile synchronized with local database successfully!");
      } else {
        alert("Server failed to update profile.");
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSimulatedSubscribe = async (planName: string, amount: number) => {
    if (!user?.uid) return;
    setSubscribingLoader(true);
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          planName,
          amount,
          status: 'active'
        })
      });
      if (res.ok) {
        await refreshProfile();
        await fetchPaymentHistory();
        alert(`Successfully subscribed to ${planName}! Active plan initialized in database.`);
      } else {
        alert("Failed to initialize plan on database.");
      }
    } catch (e: any) {
      alert("Error processing: " + e.message);
    } finally {
      setSubscribingLoader(false);
    }
  };

  // Sidebar navigations options
  const navTabs = [
    { id: 'credit', label: 'Credit Repair & Audits', desc: 'FICO score tracker, dispute generator & OCR report scans', icon: BarChart },
    { id: 'funding', label: 'Business & Personal Funding', desc: 'Check eligibility, lender matching & readiness dials', icon: Briefcase },
    { id: 'formation_tax_imm', label: 'Administrative Services', desc: 'LLC Formation, Tax W2 vaults & USCIS check sheets', icon: Building },
    { id: 'education', label: 'Academy & Simulators', desc: 'FICO rating simulators & financial publications', icon: GraduationCap },
    { id: 'ai_assistant', label: 'FTF AI Virtual Assistant', desc: '24/7 Credit analysis and regulatory assistant', icon: Bot },
    { id: 'crm_suite', label: 'CRM & Messaging Gateway', desc: 'Leads tracker, notes, and outbox texting', icon: Users },
    { id: 'security_hub', label: 'Security & Compliance Logs', desc: '2FA settings, AES-256 state, and live audit lists', icon: Lock },
    { id: 'billing_sub', label: 'Subscriptions & Invoicing', desc: 'Stripe recurring receipts & pricing models', icon: CreditCard },
    { id: 'profile_settings', label: 'My Personal Settings', desc: 'Update profile biodata & credentials', icon: Settings }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        
        {/* TOP STATUS CONTROL HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-200 pb-6 text-left">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-neutral-400 font-mono text-[10px] font-black uppercase tracking-widest">
              <Sparkles size={14} className="text-yellow-500 animate-spin" /> Executive Unified Dashboard
            </div>
            <h1 className="font-display text-3xl font-black text-neutral-900 tracking-tight">
              FTF Credit Repair System
            </h1>
            <p className="text-neutral-500 text-xs">
              Direct access to credit, funding, entity formations, private accounting, and secure AI utilities.
            </p>
          </div>
          
          {/* Direct billing subscription status indicator */}
          <div className="flex items-center gap-3 bg-neutral-900 text-white rounded-2xl p-4 shadow-lg shrink-0 border border-neutral-850">
            <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400">
              <ShieldCheck size={20} />
            </div>
            <div className="text-left leading-none">
              <div className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">Gateway status</div>
              <div className="text-sm font-black mt-1.5 flex items-center gap-1.5">
                {user?.sub_status === 'active' ? (
                  <span className="text-emerald-400">{user.plan_name || 'Premium'} Active</span>
                ) : (
                  <span className="text-amber-400">Standard Access</span>
                )}
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* TWO-COLUMN RAIL LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: NAVIGATION RAIL (4 Columns on Desktop, horizontal top row on mobile) */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Mobile Horizontal scroll layout */}
            <div className="flex lg:hidden overflow-x-auto gap-2 pb-2 scrollbar-none border-b border-neutral-200">
              {navTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSearchParams({ tab: tab.id })}
                    className={cn(
                      "px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 cursor-pointer flex items-center gap-1.5",
                      isActive 
                        ? "bg-neutral-900 text-white border-neutral-900 shadow" 
                        : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-900"
                    )}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Desktop vertical sidebar rail */}
            <div className="hidden lg:flex flex-col bg-white border border-neutral-150 rounded-[32px] p-4 shadow-xs text-left">
              <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400 px-4 pt-2 pb-3 block border-b border-neutral-100">
                Dashboard Modules
              </span>
              <div className="space-y-1 mt-3">
                {navTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setSearchParams({ tab: tab.id })}
                      className={cn(
                        "w-full px-4 py-3 rounded-2xl transition-all cursor-pointer text-left flex items-start gap-3 group relative overflow-hidden",
                        isActive 
                          ? "bg-neutral-900 text-white shadow-md border-neutral-950" 
                          : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950"
                      )}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-0 w-1 h-full bg-emerald-500 rounded-full" />
                      )}
                      <Icon size={18} className={cn("mt-0.5 shrink-0 transition-transform group-hover:scale-110", isActive ? "text-emerald-400" : "text-neutral-400")} />
                      <div className="min-w-0">
                        <div className="text-xs font-black leading-tight truncate">{tab.label}</div>
                        <div className={cn("text-[9px] font-semibold mt-0.5 leading-snug line-clamp-1", isActive ? "text-neutral-400" : "text-neutral-400")}>
                          {tab.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Helper Tip Box */}
            <div className="hidden lg:block p-5 bg-neutral-900 text-neutral-400 rounded-[32px] border border-neutral-850 text-xs text-left leading-normal space-y-2">
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider block">Broker QuickTip</span>
              <p className="font-semibold text-[11px]">
                Always secure client digital signatures under Phase 1 before filing disputes. The Fair Credit Reporting Act requires strict consumer authorization validation.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN: CORE ACTIVE MODULE CONTAINER (9 Columns on Desktop) */}
          <div className="lg:col-span-9 min-w-0">
            
            {/* TAB CONTENT RENDERS */}

            {/* Tab: Credit Repair & Auditing */}
            {activeTab === 'credit' && (
              <div className="animate-in fade-in duration-300">
                <FtfCreditRepair />
              </div>
            )}

            {/* Tab: Business & Personal Funding */}
            {activeTab === 'funding' && (
              <div className="animate-in fade-in duration-300">
                <FtfFundingModule />
              </div>
            )}

            {/* Tab: Administrative Services */}
            {activeTab === 'formation_tax_imm' && (
              <div className="animate-in fade-in duration-300">
                <FtfFormationTaxImmigration />
              </div>
            )}

            {/* Tab: Academy & Credit Simulators */}
            {activeTab === 'education' && (
              <div className="animate-in fade-in duration-300">
                <FtfEducationSimulator />
              </div>
            )}

            {/* Tab: FTF AI Chat */}
            {activeTab === 'ai_assistant' && (
              <div className="animate-in fade-in duration-300">
                <FtfAiAssistant />
              </div>
            )}

            {/* Tab: CRM Broker Dashboard */}
            {activeTab === 'crm_suite' && (
              <div className="animate-in fade-in duration-300">
                <FtfCrmSimulator />
              </div>
            )}

            {/* Tab: Security compliance hub */}
            {activeTab === 'security_hub' && (
              <div className="animate-in fade-in duration-300">
                <FtfSecurityHub />
              </div>
            )}

            {/* Tab: Billing preservation */}
            {activeTab === 'billing_sub' && (
              <div className="space-y-8 animate-in fade-in duration-300 text-left">
                {/* pricing plans */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {plans.map((p) => {
                    const isActive = user?.plan_name === p.name && user?.sub_status === 'active';
                    return (
                      <div 
                        key={p.name} 
                        className={cn(
                          "rounded-[32px] border p-8 flex flex-col relative overflow-hidden transition-all text-left",
                          isActive 
                            ? "border-neutral-900 bg-neutral-900 text-white shadow-xl scale-[1.02]" 
                            : "border-neutral-150 bg-white text-neutral-900 shadow-sm hover:border-neutral-300"
                        )}
                      >
                        {isActive && (
                          <span className="absolute top-4 right-4 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                            Active License
                          </span>
                        )}
                        <h3 className="font-display font-black text-lg uppercase tracking-wide">{p.name}</h3>
                        <div className="mt-4 flex items-baseline gap-1">
                          <span className="text-3xl font-black font-display">${p.price}</span>
                          <span className="text-xs opacity-75">/ month</span>
                        </div>
                        
                        <ul className="mt-6 space-y-3.5 flex-1 border-t border-neutral-200/25 pt-6">
                          {p.features.map(f => (
                            <li key={f} className="flex items-center gap-2 text-xs font-bold leading-none">
                              <CheckCircle2 size={14} className={isActive ? "text-emerald-400" : "text-emerald-600"} />
                              <span className="opacity-80">{f}</span>
                            </li>
                          ))}
                        </ul>

                        <button
                          disabled={isActive || subscribingLoader}
                          onClick={() => handleSimulatedSubscribe(p.name, p.price)}
                          className={cn(
                            "w-full rounded-2xl py-3.5 text-xs font-extrabold uppercase tracking-wider mt-8 transition-all cursor-pointer flex items-center justify-center gap-2",
                            isActive 
                              ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 cursor-default" 
                              : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md hover:shadow-lg hover:scale-[1.01]"
                          )}
                        >
                          {subscribingLoader ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : isActive ? (
                            'Active Plan License'
                          ) : (
                            `Subscribe • $${p.price}`
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* invoices */}
                <div className="bg-white rounded-[32px] border border-neutral-150 p-8 shadow-sm space-y-6">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                    <div>
                      <h3 className="font-display font-extrabold text-base text-neutral-900">Transaction Receipts</h3>
                      <p className="text-xs text-neutral-500 mt-1">Detailed billing history for plan subscription invoices.</p>
                    </div>
                    <button 
                      onClick={fetchPaymentHistory}
                      className="px-4 py-2 border border-neutral-200 hover:border-neutral-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      Refresh Invoices
                    </button>
                  </div>

                  {loadingHistory ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2 text-neutral-400 text-xs">
                      <Loader2 size={24} className="animate-spin text-neutral-900" />
                      Loading receipts...
                    </div>
                  ) : paymentHistory.length === 0 ? (
                    <div className="py-12 text-center text-xs text-neutral-400 italic">
                      No invoices logged yet. Subscription updates register here instantly.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-neutral-100 text-[10px] font-black uppercase tracking-wider text-neutral-400">
                            <th className="pb-3 font-extrabold">Invoice Ref</th>
                            <th className="pb-3 font-extrabold">Billing Date</th>
                            <th className="pb-3 font-extrabold text-center">Amount Paid</th>
                            <th className="pb-3 font-extrabold text-center">Channel</th>
                            <th className="pb-3 font-extrabold text-right">Receipt Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-50 text-xs font-bold text-neutral-800">
                          {paymentHistory.map((pm) => (
                            <tr key={pm.id} className="hover:bg-neutral-50/50">
                              <td className="py-4 font-mono font-medium text-neutral-500 text-[11px]">{pm.id}</td>
                              <td className="py-4 font-normal text-neutral-600">{new Date(pm.paymentDate || pm.createdAt).toLocaleString()}</td>
                              <td className="py-4 text-center font-bold font-display">${Number(pm.amount).toFixed(2)}</td>
                              <td className="py-4 text-center">
                                <span className="bg-neutral-100 px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-tighter">
                                  {pm.paymentType || 'CARD'}
                                </span>
                              </td>
                              <td className="py-4 text-right">
                                <span className={cn(
                                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider",
                                  pm.status === 'success' ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                                )}>
                                  {pm.status === 'success' ? 'Successful Paid' : 'Declined'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab: Profile form preservation */}
            {activeTab === 'profile_settings' && (
              <div className="bg-white rounded-[32px] border border-neutral-150 p-8 shadow-sm space-y-6 text-left max-w-3xl mx-auto animate-in fade-in duration-300">
                <div>
                  <h2 className="font-display text-xl font-extrabold text-neutral-900">Personal Information</h2>
                  <p className="text-xs text-neutral-500 mt-1">Synchronize your personal details and business contact settings.</p>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-6 pt-4 border-t border-neutral-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-xs font-bold focus:border-neutral-900 focus:ring-0"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Phone Number</label>
                      <input 
                        type="tel" 
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-xs font-bold focus:border-neutral-900 focus:ring-0"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Street Address</label>
                      <input 
                        type="text" 
                        value={profileAddress}
                        onChange={(e) => setProfileAddress(e.target.value)}
                        className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-xs font-bold focus:border-neutral-900 focus:ring-0"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">City</label>
                      <input 
                        type="text" 
                        value={profileCity}
                        onChange={(e) => setProfileCity(e.target.value)}
                        className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-xs font-bold focus:border-neutral-900 focus:ring-0"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">State</label>
                        <input 
                          type="text" 
                          value={profileState}
                          onChange={(e) => setProfileState(e.target.value)}
                          className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-xs font-bold focus:border-neutral-900 focus:ring-0"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Zip Code</label>
                        <input 
                          type="text" 
                          value={profileZip}
                          onChange={(e) => setProfileZip(e.target.value)}
                          className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-xs font-bold focus:border-neutral-900 focus:ring-0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-6 border-t border-neutral-100">
                    <button 
                      type="submit"
                      disabled={savingProfile}
                      className="px-6 py-3 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
                    >
                      {savingProfile ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                      {savingProfile ? 'Updating Database...' : 'Save Settings'}
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
