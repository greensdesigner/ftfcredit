import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { 
  Users, CreditCard, Search, CheckCircle2, Loader2, 
  X, User, MapPin, Sparkles, RefreshCw, Key, ShieldCheck, Mail, Phone, Settings, Activity
} from 'lucide-react';
import { cn } from '../lib/utils';

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
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [systemSettings, setSystemSettings] = useState<any>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  
  const { user, refreshProfile } = useAuth();
  const tenantId = user?.uid;
  const displayFee = user?.sub_amount !== undefined && user?.sub_amount !== null
    ? Number(user.sub_amount).toFixed(2)
    : '100.00';

  // Manual Stripe keys state
  const [manualPublishable, setManualPublishable] = useState('');
  const [manualSecret, setManualSecret] = useState('');
  const [stripeStatus, setStripeStatus] = useState<any>(null);
  const [savingKeys, setSavingKeys] = useState(false);
  const [onboardingStripe, setOnboardingStripe] = useState(false);

  // Agency branding states
  const [agencyName, setAgencyName] = useState(user?.agencyName || '');
  const [agencyEmail, setAgencyEmail] = useState(user?.email || '');
  const [agencyPhone, setAgencyPhone] = useState(user?.phone || '');
  const [savingAgency, setSavingAgency] = useState(false);

  useEffect(() => {
    fetchSystemSettings();
    refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    if (tenantId) {
      fetchClients();
      fetchStripeStatus();
    }
  }, [tenantId]);

  const fetchSystemSettings = async () => {
    try {
      const response = await fetch('/api/admin/system-settings');
      if (response.ok) {
        const data = await response.json();
        setSystemSettings(data);
      }
    } catch (error) {
      console.error("Failed to fetch system settings:", error);
    }
  };

  const fetchClients = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/clients?tenantId=${tenantId}`);
      if (res.ok) {
        setClients(await res.json());
      }
    } catch (e) {
      console.error("Failed to load tenant clients:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchStripeStatus = async () => {
    if (!tenantId) return;
    try {
      const res = await fetch(`/api/admin/stripe/status?uid=${tenantId}`);
      if (res.ok) {
        const data = await res.json();
        setStripeStatus(data);
        if (data.stripePublishableKey) setManualPublishable(data.stripePublishableKey);
        if (data.stripeSecretKey) setManualSecret(data.stripeSecretKey);
      }
    } catch (e) {
      console.error("Failed to fetch Stripe connection state:", e);
    }
  };

  const handleSystemPay = async () => {
    setIsPaying(true);
    try {
      const response = await fetch('/api/admin/create-system-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: user?.uid }),
      });
      if (response.ok) {
        const { url, error } = await response.json();
        if (error) throw new Error(error);
        if (url) window.location.href = url;
      }
    } catch (error: any) {
      alert("Payment redirect failed: " + error.message);
    } finally {
      setIsPaying(false);
    }
  };

  const handleManagePortal = async () => {
    setIsPaying(true);
    try {
      const response = await fetch('/api/admin/create-portal-session', { method: 'POST' });
      if (response.ok) {
        const { url, error } = await response.json();
        if (error) throw new Error(error);
        if (url) window.location.href = url;
      }
    } catch (error: any) {
      alert("Billing portal redirect failed: " + error.message);
    } finally {
      setIsPaying(false);
    }
  };

  // Onboard using Stripe Connect Standard flow
  const handleStripeConnectOnboard = async () => {
    if (!tenantId || !user?.email) return;
    setOnboardingStripe(true);
    try {
      const res = await fetch('/api/admin/stripe/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: tenantId, email: user.email })
      });
      if (res.ok) {
        const { url } = await res.json();
        if (url) window.location.href = url;
      } else {
        alert("Server failed to initiate Stripe Connect onboarding. Verify keys configuration.");
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setOnboardingStripe(false);
    }
  };

  // Overriding Manual Publishable and Secret Keys directly to database
  const handleSaveManualStripeKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setSavingKeys(true);
    try {
      const res = await fetch('/api/admin/update-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: tenantId,
          updates: {
            stripePublishableKey: manualPublishable,
            stripeSecretKey: manualSecret
          }
        })
      });
      if (res.ok) {
        await fetchStripeStatus();
        alert("Manual Stripe API keys saved and synchronized on the database successfully!");
      } else {
        alert("Failed to save custom Stripe API keys.");
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setSavingKeys(false);
    }
  };

  const handleSaveAgencySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setSavingAgency(true);
    try {
      const res = await fetch('/api/admin/agency-settings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: tenantId,
          fullName: user?.fullName,
          agencyName,
          email: agencyEmail,
          phone: agencyPhone
        })
      });
      if (res.ok) {
        await refreshProfile();
        alert("White-Label settings modified successfully!");
      } else {
        alert("Failed to update white-label agency variables.");
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setSavingAgency(false);
    }
  };

  // Filter clients dynamically
  const filteredClients = clients.filter(c => 
    c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        
        {/* Header section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-100 pb-6 text-left">
          <div>
            <div className="flex items-center gap-2 text-neutral-500 font-mono text-xs font-semibold uppercase tracking-wider">
              <Sparkles size={14} className="text-emerald-500" /> Admin Workspace Control
            </div>
            <h1 className="font-display text-3xl font-extrabold text-neutral-900 tracking-tight mt-1">
              {user?.agencyName || 'Platform Agency Administration'}
            </h1>
            <p className="text-neutral-500 text-sm mt-1">
              Onboard clients, manage licensing, configure standard Stripe connects, and customize white-label keys.
            </p>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => { fetchClients(); fetchStripeStatus(); }}
              className="p-3 bg-white border border-neutral-200 hover:border-neutral-300 text-neutral-700 rounded-2xl shadow-sm cursor-pointer transition-all"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-neutral-200 gap-2 pb-1 text-left overflow-x-auto">
          {[
            { id: 'overview', label: 'Platform Overview' },
            { id: 'clients', label: 'Client Directory' },
            { id: 'billing', label: 'License Billing' },
            { id: 'settings', label: 'Stripe & Settings' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSearchParams({ tab: tab.id })}
              className={cn(
                "px-5 py-3 text-xs font-extrabold uppercase tracking-widest border-b-2 transition-all cursor-pointer whitespace-nowrap",
                activeTab === tab.id 
                  ? "border-neutral-900 text-neutral-900 font-extrabold" 
                  : "border-transparent text-neutral-400 hover:text-neutral-600"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ------------------ OVERVIEW TAB ------------------ */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              <div className="bg-white rounded-[32px] border border-neutral-150 p-6 shadow-sm flex items-center gap-4 text-left">
                <div className="size-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shrink-0">
                  <Users size={20} />
                </div>
                <div>
                  <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Total Clients</div>
                  <div className="text-2xl font-black font-display text-neutral-900 mt-1">{clients.length}</div>
                </div>
              </div>

              <div className="bg-white rounded-[32px] border border-neutral-150 p-6 shadow-sm flex items-center gap-4 text-left">
                <div className="size-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Activity size={20} />
                </div>
                <div>
                  <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Active Subs</div>
                  <div className="text-2xl font-black font-display text-neutral-900 mt-1">
                    {clients.filter(c => c.sub_status === 'active').length}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[32px] border border-neutral-150 p-6 shadow-sm flex items-center gap-4 text-left">
                <div className="size-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                  <CreditCard size={20} />
                </div>
                <div>
                  <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">MRR Estimate</div>
                  <div className="text-2xl font-black font-display text-neutral-900 mt-1">
                    ${clients.reduce((acc, c) => acc + (c.sub_status === 'active' ? (c.amount || 0) : 0), 0)}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[32px] border border-neutral-150 p-6 shadow-sm flex items-center gap-4 text-left">
                <div className="size-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Stripe Link</div>
                  <div className="text-sm font-black text-neutral-900 mt-1.5 uppercase tracking-wide">
                    {stripeStatus?.isConnected ? (
                      <span className="text-emerald-600 font-black">Connected</span>
                    ) : (
                      <span className="text-neutral-500">Not Linked</span>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Quick Setup Check */}
            <div className="bg-white border border-neutral-150 rounded-[32px] p-8 shadow-sm text-left flex flex-col md:flex-row gap-6 items-start">
              <div className="size-12 bg-neutral-900 text-white rounded-2xl flex items-center justify-center shrink-0">
                <ShieldCheck size={24} />
              </div>
              <div className="space-y-2 flex-1">
                <h2 className="text-base font-extrabold text-neutral-900">Your SaaS Billing Boilerplate is Live!</h2>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  We have purged all credit repair specific items and kept your full Stripe direct customer payments, setup intents, ACH tokenization, and multi-tenant isolation modules 100% functional. You can see your client registrations populate in the Client Directory immediately upon their signup.
                </p>
              </div>
            </div>

          </div>
        )}

        {/* ------------------ CLIENTS TAB ------------------ */}
        {activeTab === 'clients' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* Search client filtering */}
            <div className="bg-white rounded-[32px] border border-neutral-150 p-6 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:max-w-md">
                <input 
                  type="text" 
                  placeholder="Filter clients by name or email address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-2xl border border-neutral-200 pl-11 pr-4 py-3 text-xs font-bold focus:border-neutral-900 focus:ring-0"
                />
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
              </div>
              
              <div className="text-xs text-neutral-500 font-bold shrink-0">
                Found {filteredClients.length} of {clients.length} clients registered
              </div>
            </div>

            {/* Client Table Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Table Column */}
              <div className="lg:col-span-8 bg-white rounded-[32px] border border-neutral-150 shadow-sm overflow-hidden text-left">
                {loading ? (
                  <div className="py-24 text-center text-xs text-neutral-400 flex flex-col items-center gap-2">
                    <Loader2 size={24} className="animate-spin text-neutral-950" />
                    Querying registered tenant client databases...
                  </div>
                ) : filteredClients.length === 0 ? (
                  <div className="py-24 text-center text-xs text-neutral-400 italic">
                    No matching clients found in this tenant directory.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-neutral-150 text-[10px] font-black uppercase tracking-wider text-neutral-400 bg-neutral-50/50">
                          <th className="px-6 py-4">Client Detail</th>
                          <th className="px-6 py-4 text-center">Active Service Plan</th>
                          <th className="px-6 py-4 text-center">Plan Amount</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 text-xs font-bold text-neutral-800">
                        {filteredClients.map((client) => (
                          <tr 
                            key={client.uid} 
                            onClick={() => setSelectedClient(client)}
                            className={cn(
                              "hover:bg-neutral-50/50 cursor-pointer transition-colors",
                              selectedClient?.uid === client.uid ? "bg-neutral-50" : ""
                            )}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="size-9 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center shrink-0 uppercase">
                                  {client.fullName.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-extrabold text-neutral-900 truncate">{client.fullName}</div>
                                  <div className="text-[10px] text-neutral-400 font-normal truncate mt-0.5">{client.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={cn(
                                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider",
                                client.sub_status === 'active' ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-500"
                              )}>
                                <span className={cn("size-1 rounded-full", client.sub_status === 'active' ? "bg-emerald-500" : "bg-neutral-400")} />
                                {client.plan_name || 'No Active Plan'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center font-display font-black text-neutral-900">
                              ${client.amount !== null ? Number(client.amount).toFixed(2) : '0.00'}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button className="text-[10px] text-neutral-400 hover:text-neutral-950 uppercase font-black tracking-widest">
                                Details &rarr;
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Detail Sidebar Panel */}
              <div className="lg:col-span-4 bg-white rounded-[32px] border border-neutral-150 p-6 shadow-sm text-left space-y-6">
                {selectedClient ? (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="flex justify-between items-start border-b border-neutral-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="size-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center text-lg font-black shrink-0">
                          {selectedClient.fullName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-display font-extrabold text-neutral-900 text-base">{selectedClient.fullName}</h4>
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">ID Ref: {selectedClient.uid.substring(0, 8)}</span>
                        </div>
                      </div>
                      <button onClick={() => setSelectedClient(null)} className="text-neutral-400 hover:text-neutral-900 cursor-pointer">
                        <X size={18} />
                      </button>
                    </div>

                    <div className="space-y-4 text-xs">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Email Contact</span>
                        <div className="font-bold text-neutral-900 flex items-center gap-2">
                          <Mail size={14} className="text-neutral-400 shrink-0" />
                          {selectedClient.email}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Phone Connection</span>
                        <div className="font-bold text-neutral-900 flex items-center gap-2">
                          <Phone size={14} className="text-neutral-400 shrink-0" />
                          {selectedClient.phone || 'No phone registered'}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Onboarding Step Status</span>
                        <div className="font-bold text-neutral-900 flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-neutral-400 shrink-0" />
                          Completed Step {selectedClient.onboardingStep || 1} of 3
                        </div>
                      </div>

                      {selectedClient.streetAddress && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Postal Address</span>
                          <div className="font-bold text-neutral-700 flex items-start gap-2 leading-relaxed">
                            <MapPin size={14} className="text-neutral-400 shrink-0 mt-0.5" />
                            {selectedClient.streetAddress}, {selectedClient.city}, {selectedClient.state} {selectedClient.zipCode}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100 text-xs">
                      <div className="font-black text-[10px] uppercase tracking-widest text-neutral-400 mb-2">Subscription & Plan</div>
                      <div className="flex justify-between items-center py-1.5 border-b border-neutral-200/50 font-bold">
                        <span className="text-neutral-500">Service Plan</span>
                        <span className="text-neutral-950">{selectedClient.plan_name || 'None'}</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-neutral-200/50 font-bold">
                        <span className="text-neutral-500">Current Amount</span>
                        <span className="text-neutral-950 font-display">${selectedClient.amount || '0.00'}/mo</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 font-bold">
                        <span className="text-neutral-500">Status State</span>
                        <span className={cn(
                          "uppercase tracking-widest text-[9px] font-black",
                          selectedClient.sub_status === 'active' ? "text-emerald-600" : "text-neutral-400"
                        )}>{selectedClient.sub_status || 'inactive'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-24 text-center text-neutral-400 text-xs italic">
                    Select any client record in directory list to display full detailed profile panel.
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* ------------------ BILLING TAB ------------------ */}
        {activeTab === 'billing' && (
          <div className="space-y-8 animate-in fade-in duration-300 text-left max-w-4xl mx-auto">
            
            <div className="bg-white rounded-[32px] border border-neutral-150 p-8 shadow-sm flex flex-col md:flex-row gap-8 items-start">
              <div className="size-16 rounded-3xl bg-neutral-950 text-white flex items-center justify-center shrink-0">
                <CreditCard size={28} />
              </div>
              <div className="space-y-4 flex-1">
                <div>
                  <h3 className="font-display font-extrabold text-neutral-900 text-lg">System Licensing & Billing</h3>
                  <p className="text-xs text-neutral-500 mt-1">Your monthly license fee is currently ${displayFee}/month.</p>
                </div>
                
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Your billing subscription ensures administrative portal functions, client registrations limits, and standard Stripe Connect pipelines remain active. If your license expires, client directories will temporarily lock.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    disabled={isPaying}
                    onClick={handleSystemPay}
                    className="px-6 py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isPaying ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                    Checkout License Renewal
                  </button>
                  
                  <button
                    disabled={isPaying}
                    onClick={handleManagePortal}
                    className="px-6 py-3.5 border border-neutral-200 hover:border-neutral-300 bg-white text-neutral-700 text-xs font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Stripe Customer Portal
                  </button>
                </div>
              </div>
            </div>

            {/* Simulated instant bypass in dev mode */}
            <div className="bg-amber-50 border border-amber-100 rounded-[32px] p-6 text-left flex gap-4">
              <ShieldCheck className="text-amber-600 shrink-0 mt-0.5" size={20} />
              <div className="space-y-1">
                <h4 className="text-xs font-extrabold text-amber-900 uppercase tracking-wide">Developer Sandbox Tools</h4>
                <p className="text-xs text-amber-800 leading-relaxed">
                  During development, clicking "Checkout License Renewal" will initiate Stripe on localhost if configured. Otherwise, you can easily synchronize licenses directly in the databases with simulated statuses.
                </p>
              </div>
            </div>

          </div>
        )}

        {/* ------------------ SETTINGS TAB ------------------ */}
        {activeTab === 'settings' && (
          <div className="space-y-8 animate-in fade-in duration-300 text-left max-w-4xl mx-auto">
            
            {/* White-Label Settings Form */}
            <div className="bg-white rounded-[32px] border border-neutral-150 p-8 shadow-sm space-y-6">
              <div>
                <h3 className="font-display font-extrabold text-neutral-900 text-base">White-Label Branding Settings</h3>
                <p className="text-xs text-neutral-500 mt-1">Configure your custom agency name used dynamically across client dashboards.</p>
              </div>

              <form onSubmit={handleSaveAgencySettings} className="space-y-6 pt-4 border-t border-neutral-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Agency Brand Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Acme SaaS Consulting"
                      value={agencyName}
                      onChange={(e) => setAgencyName(e.target.value)}
                      className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-xs font-bold focus:border-neutral-900 focus:ring-0"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Support Email Address</label>
                    <input 
                      type="email" 
                      required
                      placeholder="support@acme.com"
                      value={agencyEmail}
                      onChange={(e) => setAgencyEmail(e.target.value)}
                      className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-xs font-bold focus:border-neutral-900 focus:ring-0"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Support Phone Number</label>
                    <input 
                      type="tel" 
                      placeholder="+1 (555) 0199"
                      value={agencyPhone}
                      onChange={(e) => setAgencyPhone(e.target.value)}
                      className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-xs font-bold focus:border-neutral-900 focus:ring-0"
                    />
                  </div>

                </div>

                <div className="flex justify-end pt-4">
                  <button 
                    type="submit"
                    disabled={savingAgency}
                    className="px-6 py-3 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all cursor-pointer flex items-center gap-2"
                  >
                    {savingAgency ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    Update Agency Branding
                  </button>
                </div>
              </form>
            </div>

            {/* Stripe Integration Setup */}
            <div className="bg-white rounded-[32px] border border-neutral-150 p-8 shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
                <div>
                  <h3 className="font-display font-extrabold text-neutral-900 text-base">Direct Client Billing Integration (Stripe Connect)</h3>
                  <p className="text-xs text-neutral-500 mt-1">Receive direct client subscriptions instantly in your standard or manual Stripe accounts.</p>
                </div>
                
                {/* Stripe Connected Indicator */}
                <div className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border",
                  stripeStatus?.isConnected 
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                    : "bg-neutral-50 border-neutral-200 text-neutral-500"
                )}>
                  <span className={cn("size-2 rounded-full", stripeStatus?.isConnected ? "bg-emerald-500 animate-pulse" : "bg-neutral-400")} />
                  Stripe Link: {stripeStatus?.isConnected ? 'Active' : 'Unlinked'}
                </div>
              </div>

              {/* Stripe Connect Standard Onboarding Flow */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                
                <div className="md:col-span-5 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-600" /> Option A: Stripe Connect Standard
                  </h4>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Link your standard business Stripe account instantly using Stripe Secure Connect. Payments from clients are processed, splits can be configured, and transfers settle directly in your verified bank.
                  </p>
                  
                  <button
                    onClick={handleStripeConnectOnboard}
                    disabled={onboardingStripe}
                    className="w-full rounded-2xl bg-neutral-950 hover:bg-neutral-800 py-3.5 text-xs font-black uppercase tracking-widest text-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {onboardingStripe ? <Loader2 size={14} className="animate-spin" /> : <Key size={14} />}
                    {stripeStatus?.stripeAccountId ? 'Configure Connect Account' : 'Connect Standard Stripe'}
                  </button>
                  {stripeStatus?.stripeAccountId && (
                    <div className="text-[10px] text-neutral-400 text-center font-bold">
                      Linked ID: {stripeStatus.stripeAccountId}
                    </div>
                  )}
                </div>

                <div className="md:col-span-2 flex md:flex-col items-center justify-center h-full text-xs text-neutral-300 font-extrabold uppercase py-4">
                  <span className="bg-white px-2 z-10">Or</span>
                  <div className="w-full md:w-[1px] h-[1px] md:h-24 bg-neutral-100 absolute -z-0" />
                </div>

                {/* Option B: Manual API Credentials Overwrite */}
                <form onSubmit={handleSaveManualStripeKeys} className="md:col-span-5 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                    <Key size={16} className="text-neutral-900" /> Option B: Custom Stripe API Keys Override
                  </h4>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Directly override system settings and paste your exact custom Stripe publishable and secret keys to run client transactions on your isolated workspace pipeline.
                  </p>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Custom Publishable Key (pk_test/...)</label>
                      <input 
                        type="text" 
                        placeholder="pk_test_..."
                        value={manualPublishable}
                        onChange={(e) => setManualPublishable(e.target.value)}
                        className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-xs font-bold focus:border-neutral-900 focus:ring-0"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Custom Secret Key (sk_test/...)</label>
                      <input 
                        type="password" 
                        placeholder="sk_test_••••••••••••"
                        value={manualSecret}
                        onChange={(e) => setManualSecret(e.target.value)}
                        className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-xs font-bold focus:border-neutral-900 focus:ring-0"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingKeys}
                    className="w-full rounded-2xl bg-neutral-900 hover:bg-neutral-800 py-3.5 text-xs font-black uppercase tracking-widest text-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {savingKeys ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    Save Custom Stripe Keys
                  </button>
                </form>

              </div>
            </div>

          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
