import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { CreditCard, Download, Calendar, CheckCircle2, AlertCircle, Loader2, Plus, Lock } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

function AddCardForm({ onCancel, onSuccess, userId, email, tenantId, amount, planName, loadedPubKey, keySource }: any) {
  const stripe = useStripe();
  const elements = useElements();
  const [activeTab, setActiveTab] = useState<'card' | 'ach'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ACH bank states
  const [achName, setAchName] = useState('');
  const [achRouting, setAchRouting] = useState('');
  const [achAccount, setAchAccount] = useState('');
  const [achType, setAchType] = useState<'individual' | 'company'>('individual');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe) return;

    setIsProcessing(true);
    setError(null);

    try {
      if (activeTab === 'card') {
        if (!elements) return;

        // 1. Create Setup Intent
        const siRes = await fetch('/api/client/create-setup-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: userId, email, tenantId }),
        });

        const siContentType = siRes.headers.get('content-type');
        if (!siContentType || !siContentType.includes('application/json')) {
          throw new Error("Invalid response received from the server. Verify server environment config.");
        }

        const siData = await siRes.json();
        if (siData.error) throw new Error(siData.error);
        const clientSecret = siData.clientSecret;

        // 2. Confirm Card Setup
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) throw new Error("Card element not found");

        const { setupIntent, error: confirmError } = await stripe.confirmCardSetup(clientSecret, {
          payment_method: { card: cardElement as any },
        });

        if (confirmError) throw new Error(confirmError.message);

        // 3. Initiate Subscription Charge via Connect
        const subRes = await fetch('/api/client/subscribe-connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            tenantId,
            planName,
            amount,
            paymentMethodId: setupIntent?.payment_method
          }),
        });

        const subResult = await subRes.json();
        if (subResult.error) throw new Error(subResult.error);

        onSuccess(setupIntent?.payment_method);
      } else {
        // ACH Bank Account integration
        if (!achName.trim()) throw new Error("Please enter the account holder name.");
        if (!achRouting.trim() || achRouting.trim().length !== 9) throw new Error("Please enter a valid 9-digit routing number.");
        if (!achAccount.trim()) throw new Error("Please enter your bank account number.");

        // Create Token via stripe.js
        const result = await stripe.createToken('bank_account', {
          country: 'US',
          currency: 'usd',
          routing_number: achRouting.trim(),
          account_number: achAccount.trim(),
          account_holder_name: achName.trim(),
          account_holder_type: achType,
        });

        if (result.error) throw new Error(result.error.message);

        const token = result.token?.id;
        if (!token) throw new Error("Stripe bank token generation failed.");

        // Charge and connect bank on backend
        const achRes = await fetch('/api/client/connect-bank-ach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            email,
            tenantId,
            token,
            amount,
            planName
          }),
        });

        const achResult = await achRes.json();
        if (achResult.error) throw new Error(achResult.error);

        onSuccess('bank', achResult);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tab Selection */}
      <div className="flex border-b border-neutral-150 pb-1 gap-2">
        <button
          type="button"
          onClick={() => {
            setActiveTab('card');
            setError(null);
          }}
          className={cn(
            "flex-1 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 text-center transition-all cursor-pointer",
            activeTab === 'card' ? "border-neutral-900 text-neutral-900 font-bold" : "border-transparent text-neutral-400 hover:text-neutral-600"
          )}
        >
          Credit / Debit Card
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('ach');
            setError(null);
          }}
          className={cn(
            "flex-1 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 text-center transition-all cursor-pointer",
            activeTab === 'ach' ? "border-neutral-900 text-neutral-900 font-bold" : "border-transparent text-neutral-400 hover:text-neutral-600"
          )}
        >
          Bank Account (ACH)
        </button>
      </div>

      {activeTab === 'card' ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-neutral-200 bg-white">
            <CardElement 
              options={{
                style: {
                  base: {
                    fontSize: '14px',
                    color: '#171717',
                    '::placeholder': { color: '#a3a3a3' },
                    fontFamily: 'Inter, sans-serif'
                  },
                },
              }}
            />
          </div>
          <p className="text-[10px] text-neutral-400">Card credentials are tokenized securely directly with Stripe. PCI-DSS compliant.</p>
        </div>
      ) : (
        <div className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Account Holder Name</label>
            <input 
              type="text" 
              required
              placeholder="e.g. John Doe"
              value={achName}
              onChange={(e) => setAchName(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-xs font-bold focus:border-neutral-900 focus:ring-0"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">9-Digit Routing Number</label>
              <input 
                type="text" 
                maxLength={9}
                required
                placeholder="123456789"
                value={achRouting}
                onChange={(e) => setAchRouting(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-xs font-bold focus:border-neutral-900 focus:ring-0"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Bank Account Number</label>
              <input 
                type="text" 
                required
                placeholder="000123456"
                value={achAccount}
                onChange={(e) => setAchAccount(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-xs font-bold focus:border-neutral-900 focus:ring-0"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Account Holder Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs font-bold text-neutral-700 cursor-pointer">
                <input 
                  type="radio" 
                  checked={achType === 'individual'} 
                  onChange={() => setAchType('individual')}
                  className="text-neutral-900 focus:ring-0" 
                />
                Individual Checking
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-neutral-700 cursor-pointer">
                <input 
                  type="radio" 
                  checked={achType === 'company'} 
                  onChange={() => setAchType('company')}
                  className="text-neutral-900 focus:ring-0" 
                />
                Corporate Checking
              </label>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex gap-2 text-red-700 text-xs">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <p className="font-semibold">{error}</p>
        </div>
      )}

      <div className="flex gap-3 justify-end pt-4 border-t border-neutral-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="px-4 py-2.5 rounded-xl border border-neutral-200 text-neutral-600 font-bold text-xs hover:bg-neutral-50 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isProcessing || !stripe}
          className="px-6 py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
        >
          {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Lock size={12} />}
          {isProcessing ? 'Processing Payment...' : 'Authorize & Checkout'}
        </button>
      </div>
    </form>
  );
}

export default function BillingPage() {
  const { user, refreshProfile } = useAuth();
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [pubKey, setPubKey] = useState('');
  const [keySource, setKeySource] = useState('environment');
  const [loading, setLoading] = useState(true);
  const [systemLicense, setSystemLicense] = useState<any>(null);
  const [processingLicense, setProcessingLicense] = useState(false);

  // Selector plans
  const [plans] = useState([
    { name: 'Standard Plan', price: 99, description: 'Core Application Package' },
    { name: 'Premium Plan', price: 149, description: 'SaaS Professional Automation' },
    { name: 'Elite Plan', price: 299, description: 'Custom Corporate Workspace' }
  ]);

  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  useEffect(() => {
    fetchStripeKey();
    fetchSystemLicense();
    if (user?.uid) {
      fetchPayments();
    }
  }, [user]);

  const fetchSystemLicense = async () => {
    try {
      const res = await fetch('/api/admin/system-settings');
      if (res.ok) {
        setSystemLicense(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch system license settings:", e);
    }
  };

  const handleSimulateExpiry = async () => {
    setProcessingLicense(true);
    try {
      const res = await fetch('/api/admin/system-expire', { method: 'POST' });
      if (res.ok) {
        await fetchSystemLicense();
        alert("Success! System license has been set to EXPIRED. The entire software workspace is now automatically locked. Refreshing page...");
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingLicense(false);
    }
  };

  const handleRenewLicense = async () => {
    setProcessingLicense(true);
    try {
      const res = await fetch('/api/admin/system-pay', { method: 'POST' });
      if (res.ok) {
        await fetchSystemLicense();
        alert("Success! Paid $100.00 subscription fee. System license is now ACTIVE and valid for the next 30 days.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingLicense(false);
    }
  };

  const fetchStripeKey = async () => {
    setLoading(true);
    try {
      const tenantParam = user?.tenantId ? `?tenantId=${user.tenantId}` : '';
      const res = await fetch(`/api/stripe/publishable-key${tenantParam}`);
      if (res.ok) {
        const data = await res.json();
        if (data.publishableKey) {
          setPubKey(data.publishableKey);
          setKeySource(data.isCustom ? 'agency_settings' : 'system_defaults');
          setStripePromise(loadStripe(data.publishableKey));
        }
      }
    } catch (e) {
      console.error("Failed to load publishable keys:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    if (!user?.uid) return;
    setLoadingPayments(true);
    try {
      const res = await fetch(`/api/users/${user.uid}/payments`);
      if (res.ok) {
        setPayments(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleCheckoutSuccess = async () => {
    setSelectedPlan(null);
    await refreshProfile();
    await fetchPayments();
    alert("Billing checkout verified! Your plan has been successfully activated in the database.");
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8 text-left">
        
        {/* Top heading */}
        <div>
          <h1 className="font-display text-3xl font-extrabold text-neutral-900 tracking-tight">Billing & Subscriptions</h1>
          <p className="text-neutral-500 text-sm mt-1">Configure automated debit plans, view invoices, and connect card properties.</p>
        </div>

        {/* SaaS Provider License Subscription Card */}
        <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 text-white rounded-[32px] p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>
          <div className="space-y-3 max-w-xl text-left">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              SaaS Provider Licensing (Greenlab Technology)
            </span>
            <h2 className="font-display font-black text-xl tracking-tight">Software Creator License Fee</h2>
            <p className="text-neutral-300 text-xs leading-relaxed font-semibold">
              New registrations receive a <strong className="text-emerald-400">15-day free trial</strong> to use this platform. After the trial period, a monthly subscription fee of <strong className="text-emerald-400">$100.00</strong> paid to <strong className="text-white">Greenlab Technology</strong> is required to keep the software active and prevent auto-locking.
            </p>
            {systemLicense && (
              <div className="flex flex-wrap gap-4 pt-1 text-[11px] font-semibold text-neutral-400">
                <div>
                  License Status: <span className={cn(systemLicense.subscriptionStatus === 'active' ? "text-emerald-400" : "text-red-400")}>{systemLicense.subscriptionStatus === 'active' ? 'Active' : 'Expired & Locked'}</span>
                </div>
                <div>•</div>
                <div>
                  Next Billing Date: <span className="text-neutral-200">{systemLicense.expiryDate ? new Date(systemLicense.expiryDate).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 shrink-0">
            <button
              onClick={handleRenewLicense}
              disabled={processingLicense}
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/20"
            >
              Pay $100.00 Subscription
            </button>
            <button
              onClick={handleSimulateExpiry}
              disabled={processingLicense || systemLicense?.subscriptionStatus === 'expired'}
              className="px-6 py-3 rounded-xl bg-red-950 hover:bg-red-900 border border-red-800/40 text-red-400 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              Simulate Expiry & Lock
            </button>
          </div>
        </div>

        {/* Active plan status banner */}
        <div className="bg-white rounded-[32px] border border-neutral-150 p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-left">
            <div className="size-12 rounded-2xl bg-neutral-950 text-white flex items-center justify-center font-display shrink-0">
              {user?.plan_name ? user.plan_name.charAt(0) : '$'}
            </div>
            <div>
              <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">My Connected Membership</div>
              <h3 className="font-display font-extrabold text-neutral-900 text-base mt-0.5">
                {user?.sub_status === 'active' ? (user?.plan_name || 'Standard Plan') : 'Unsubscribed Hub'}
              </h3>
            </div>
          </div>

          <div className="text-right">
            <span className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-widest border",
              user?.sub_status === 'active' 
                ? "bg-emerald-50 border-emerald-200 text-emerald-800 animate-pulse" 
                : "bg-red-50 border-red-200 text-red-800"
            )}>
              {user?.sub_status === 'active' ? 'Active Standard Sub' : 'Subscription Overdue'}
            </span>
          </div>
        </div>

        {/* Pricing Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => {
            const isCurrent = user?.plan_name === p.name && user?.sub_status === 'active';
            return (
              <div key={p.name} className="bg-white rounded-[32px] border border-neutral-150 p-6 shadow-sm flex flex-col justify-between text-left">
                <div>
                  <h4 className="font-display font-extrabold text-neutral-900 text-sm">{p.name}</h4>
                  <p className="text-[11px] text-neutral-400 leading-normal mt-1">{p.description}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-2xl font-black font-display text-neutral-900">${p.price}</span>
                    <span className="text-[10px] text-neutral-400 font-bold">/mo</span>
                  </div>
                </div>

                <button
                  disabled={isCurrent}
                  onClick={() => setSelectedPlan(p)}
                  className={cn(
                    "w-full rounded-xl py-3 text-xs font-bold mt-6 transition-all cursor-pointer flex items-center justify-center",
                    isCurrent 
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100 cursor-default" 
                      : "bg-neutral-950 hover:bg-neutral-800 text-white shadow-sm"
                  )}
                >
                  {isCurrent ? 'Active Plan' : `Checkout $${p.price}`}
                </button>
              </div>
            );
          })}
        </div>

        {/* Stripe Elements Modal Overlay */}
        {selectedPlan && (
          <div className="fixed inset-0 z-50 bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white border border-neutral-150 rounded-[32px] p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-300">
              <div className="border-b border-neutral-100 pb-3 text-left">
                <h3 className="font-display font-extrabold text-neutral-900 text-base">Select Billing Method</h3>
                <p className="text-xs text-neutral-500 mt-1">Activating {selectedPlan.name} • ${selectedPlan.price}/month</p>
              </div>

              {loading ? (
                <div className="py-8 text-center text-xs text-neutral-400 flex flex-col items-center gap-1">
                  <Loader2 className="animate-spin" />
                  Resolving secure environment channels...
                </div>
              ) : stripePromise ? (
                <Elements stripe={stripePromise}>
                  <AddCardForm 
                    userId={user?.uid}
                    email={user?.email}
                    tenantId={user?.tenantId}
                    amount={selectedPlan.price}
                    planName={selectedPlan.name}
                    loadedPubKey={pubKey}
                    keySource={keySource}
                    onCancel={() => setSelectedPlan(null)}
                    onSuccess={handleCheckoutSuccess}
                  />
                </Elements>
              ) : (
                <div className="py-4 space-y-4">
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800 leading-relaxed text-left">
                    <p className="font-bold">Notice: Direct Integration Offline</p>
                    <p className="mt-1">
                      No publishable key is detected on this environment. Transactions can be run via simulated rapid checkout bypass by subscribing directly in the workspace dashboard!
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedPlan(null)}
                    className="w-full py-2.5 rounded-xl border border-neutral-200 text-xs font-bold hover:bg-neutral-50 cursor-pointer"
                  >
                    Close Modal Window
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transaction History receipts */}
        <div className="bg-white rounded-[32px] border border-neutral-150 p-8 shadow-sm space-y-6">
          <div className="border-b border-neutral-100 pb-4">
            <h3 className="font-display font-extrabold text-neutral-900 text-base">Invoice Transactions Receipts</h3>
            <p className="text-xs text-neutral-500 mt-1">Receipts representing direct subscription invoices charged via Stripe.</p>
          </div>

          {loadingPayments ? (
            <div className="py-8 text-center text-xs text-neutral-400 flex flex-col items-center gap-1">
              <Loader2 className="animate-spin text-neutral-950" />
              Syncing invoices history...
            </div>
          ) : payments.length === 0 ? (
            <p className="py-8 text-center text-xs text-neutral-400 italic">No transactions have been processed on this account yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-neutral-100 text-[10px] font-black uppercase tracking-wider text-neutral-400 pb-2">
                    <th className="pb-2">Invoice Hash ID</th>
                    <th className="pb-2">Billing Date</th>
                    <th className="pb-2 text-center">Amount Paid</th>
                    <th className="pb-2 text-right">Receipt Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50 text-xs font-semibold text-neutral-700">
                  {payments.map(p => (
                    <tr key={p.id}>
                      <td className="py-3.5 font-mono text-[10px] text-neutral-400">{p.id}</td>
                      <td className="py-3.5">{new Date(p.paymentDate || p.createdAt).toLocaleString()}</td>
                      <td className="py-3.5 text-center font-display font-extrabold text-neutral-950">${Number(p.amount).toFixed(2)}</td>
                      <td className="py-3.5 text-right">
                        <span className="bg-emerald-50 text-emerald-800 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                          Paid Successful
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
    </DashboardLayout>
  );
}
