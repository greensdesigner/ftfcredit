import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { Users, CreditCard, AlertCircle, Search, Filter, MoreHorizontal, ArrowUpRight, ArrowDownRight, CheckCircle2, RotateCcw, Loader2, X, Mail, Phone, Calendar, User, MapPin, ShieldCheck } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'settings' | 'billing'>('overview');

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
    if (tab === 'clients' || tab === 'settings' || tab === 'overview' || tab === 'billing') {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/clients');
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
    { label: 'Total MRR', value: `$${clients.reduce((acc, c) => acc + (c.amount || 0), 0)}`, trend: 'Real-time', up: true },
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

            {/* Alerts Panel */}
            <div className="rounded-3xl bg-amber-50 border border-amber-100 p-6">
               <div className="flex items-center gap-3 text-amber-900 mb-4">
                  <AlertCircle size={24} />
                  <h3 className="font-bold text-lg">Daily Operations</h3>
               </div>
               <p className="text-sm text-amber-800 mb-4">There are {clients.filter(c => c.onboardingStep === 1).length} new clients waiting for initial analysis. Batch processing is recommended.</p>
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
               <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                 <div>
                   <p className="font-bold">System Maintenance Mode</p>
                   <p className="text-xs text-neutral-500">Prevent client access during updates.</p>
                 </div>
                 <div className="h-6 w-11 bg-neutral-200 rounded-full cursor-not-allowed"></div>
               </div>
               <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                 <div>
                   <p className="font-bold">Automated Email Alerts</p>
                   <p className="text-xs text-neutral-500">Notify clients on progress updates automatically.</p>
                 </div>
                 <div className="h-6 w-11 bg-neutral-900 rounded-full cursor-not-allowed relative">
                   <div className="absolute right-1 top-1 size-4 bg-white rounded-full"></div>
                 </div>
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
                    <h3 className="text-xl font-bold mb-4 font-display">Billing Support</h3>
                    <p className="text-neutral-400 text-sm leading-relaxed mb-6">
                       Your enterprise platform fee includes priority support, unlimited client capacity, and dedicated server resources.
                    </p>
                    <ul className="space-y-3">
                       {[
                         'API Scaling: Enabled',
                         'Client CRM: Unlimited',
                         'Dispute Engine: Pro',
                         'Compliance: Tier 1'
                       ].map(item => (
                         <li key={item} className="flex items-center gap-2 text-xs font-medium">
                            <div className="size-1.5 rounded-full bg-emerald-500"></div>
                            {item}
                         </li>
                       ))}
                    </ul>
                  </div>
                  <div className="mt-8 pt-6 border-t border-white/10">
                     <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1">Status</p>
                     <p className={cn(
                       "font-bold",
                       systemSettings?.subscriptionStatus === 'active' ? "text-emerald-400" : "text-red-400"
                     )}>
                        {systemSettings?.subscriptionStatus === 'active' ? 'Account in good standing' : 'Account Expired'}
                     </p>
                  </div>
               </div>
            </div>
          </div>
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
