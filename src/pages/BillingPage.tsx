import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { CreditCard, Download, ExternalLink, Calendar, CheckCircle2, XCircle, AlertCircle, Loader2, Plus, Building2, ShieldCheck, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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

  // Stripe mismatch/cache troubleshooter state
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showTroubleshooter, setShowTroubleshooter] = useState(false);
  const [checkingDebug, setCheckingDebug] = useState(false);

  const runDiagnostics = async () => {
    setCheckingDebug(true);
    try {
      const res = await fetch('/api/stripe/debug-keys');
      if (res.ok) {
        const data = await res.json();
        setDebugInfo(data);
        setShowTroubleshooter(true);
      } else {
        throw new Error("Failed to reach debug route");
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setCheckingDebug(false);
    }
  };

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
          const text = await siRes.text();
          console.error("Non-JSON setup response:", text);
          throw new Error("সার্ভার থেকে ত্রুটিপূর্ণ রেসপন্স এসেছে (ServerError 500 HTML)। অনুগ্রহ করে আপনার ডোমেন/সার্ভার কনফিগারেশন, .env ফাইলে ডাটাবেস পাসওয়ার্ড, এবং স্ট্রাইপ কি (STRIPE_SECRET_KEY) সঠিক কিনা যাচাই করুন।");
        }

        const siData = await siRes.json();
        if (siData.error) throw new Error(siData.error);
        const clientSecret = siData.clientSecret;

        // 2. Confirm Card Setup
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) throw new Error("Card element not found");

        const { setupIntent, error: confirmError } = await stripe.confirmCardSetup(clientSecret, {
          payment_method: {
            card: cardElement as any,
          },
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

        const subContentType = subRes.headers.get('content-type');
        if (!subContentType || !subContentType.includes('application/json')) {
          const text = await subRes.text();
          console.error("Non-JSON subscription response:", text);
          throw new Error("সার্ভার পেমেন্ট প্রসেস করতে ব্যর্থ হয়েছে। অনুগ্রহ করে নিশ্চিত হোন যে আপনার ডাটাবেস সচল রয়েছে এবং এডমিন স্ট্রাইপ কি ও হোস্টিং সঠিক আছে।");
        }

        const subResult = await subRes.json();
        if (subResult.error) throw new Error(subResult.error);

        onSuccess(setupIntent?.payment_method);
      } else {
        // ACH Bank Account integration
        if (!achName.trim()) throw new Error("অনুগ্রহ করে অ্যাকাউন্ট হোল্ডারের নাম প্রদান করুন।");
        if (!achRouting.trim() || achRouting.trim().length !== 9) throw new Error("অনুগ্রহ করে ৯-ডিজিট সঠিক রাউটিং নাম্বার প্রদান করুন।");
        if (!achAccount.trim()) throw new Error("অনুগ্রহ করে ব্যাংক অ্যাকাউন্ট নাম্বার প্রদান করুন।");

        // 1. Create Token via stripe.js
        console.log("[Stripe ACH] Creating bank token...");
        const result = await stripe.createToken('bank_account', {
          country: 'US',
          currency: 'usd',
          routing_number: achRouting.trim(),
          account_number: achAccount.trim(),
          account_holder_name: achName.trim(),
          account_holder_type: achType,
        });

        if (result.error) {
          throw new Error(result.error.message);
        }

        const token = result.token?.id;
        if (!token) throw new Error("Stripe bank token generation failed.");

        // 2. Charge and connect bank on backend
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

        const achContentType = achRes.headers.get('content-type');
        if (!achContentType || !achContentType.includes('application/json')) {
          const text = await achRes.text();
          console.error("Non-JSON ACH response:", text);
          throw new Error("ব্যাংক পেমেন্ট প্রসেস করতে ব্যর্থ হয়েছে। দয়া করে আপনার রাউটিং এবং একাউন্ট নাম্বার চেক করে পুনরায় চেষ্টা করুন।");
        }

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
            activeTab === 'card' ? "border-neutral-900 text-neutral-900 font-bold" : "border-transparent text-neutral-400 hover:text-neutral-600 font-semibold"
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
        <div className="space-y-2 animate-in fade-in duration-200">
          <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Secure Credit or Debit Card</label>
          <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50 focus-within:border-neutral-900 transition-all">
            <CardElement options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#171717',
                  '::placeholder': { color: '#a3a3a3' },
                },
              }
            }} />
          </div>
        </div>
      ) : (
        <div className="space-y-4 text-left animate-in fade-in duration-200">
          <div>
            <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5 font-display font-semibold text-left">
              Account Holder Name (হোল্ডারের নাম)
            </label>
            <input
              type="text"
              required
              placeholder="e.g. John Doe"
              value={achName}
              onChange={(e) => setAchName(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-neutral-900 transition-all text-neutral-800 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5 font-display font-semibold text-left">
                Routing Number (রাউটিং)
              </label>
              <input
                type="text"
                required
                maxLength={9}
                placeholder="9-digit routing"
                value={achRouting}
                onChange={(e) => setAchRouting(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-neutral-900 transition-all text-neutral-800 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5 font-display font-semibold text-left">
                Account Number (অ্যাকাউন্ট)
              </label>
              <input
                type="text"
                required
                placeholder="Bank account number"
                value={achAccount}
                onChange={(e) => setAchAccount(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-neutral-900 transition-all text-neutral-800 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5 font-display font-semibold text-left">
              Account Type (অ্যাকাউন্টের ধরন)
            </label>
            <select
              value={achType}
              onChange={(e: any) => setAchType(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-neutral-900 transition-all text-neutral-800 font-medium font-sans"
            >
              <option value="individual">Personal / Individual (ব্যক্তিগত)</option>
              <option value="company">Business / Company (ব্যবসায়িক)</option>
            </select>
          </div>
        </div>
      )}

      {error && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold flex flex-col gap-2">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle size={15} />
              <span>ত্রুটি ঘটেছে (Stripe Validation Error)</span>
            </div>
            <p className="text-neutral-600 leading-relaxed text-[11px]">
              {error}
            </p>
            <div className="mt-1 pt-2 border-t border-red-100 flex flex-col gap-1 text-[11px] text-neutral-500 font-normal">
              <p className="font-semibold text-red-600">সম্ভাব্য সমাধান সমুহ:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>দয়া করে ব্রাউজার রিফ্রেশ (Ctrl + F5 অথবা Shift + Reload) দিয়ে পুনরায় চেষ্টা করুন। ক্যাশে থাকা পূর্বের ভুল কী (Stripe Key) রিমুভ হতে পারে।</li>
                <li>আপনার হোস্টিং/সার্ভার ডোমেন কনফিগারেশন এবং ডাটাবেস সংযোগ সঠিক আছে কিনা নিশ্চিত করুন।</li>
                <li>আপনার এডমিন ড্যাশবোর্ডে ও .env ফাইলে Stripe এর "Live Key-জোড়" সঠিক রয়েছে কিনা আমাদের ট্রাবলশুটার দিয়ে দেখে নিন।</li>
              </ul>
            </div>
          </div>
          
          <button
            type="button"
            onClick={runDiagnostics}
            disabled={checkingDebug}
            className="w-full flex items-center justify-center gap-2 p-3 text-xs font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-250 hover:bg-neutral-200 transition-all rounded-xl"
          >
            {checkingDebug ? <Loader2 className="animate-spin" size={13} /> : <AlertCircle size={13} />}
            সার্ভার স্ট্রাইপ কি (Verify Stripe Setup) যাচাই করুন
          </button>
        </div>
      )}

      {showTroubleshooter && debugInfo && (
        <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 text-neutral-700 text-[11px] space-y-2.5 text-left animate-in fade-in duration-300">
          <div className="flex justify-between items-center font-bold text-xs pb-1.5 border-b border-neutral-200 text-neutral-900">
            <span>Stripe Connect Diagnostics</span>
            <span className={(debugInfo.match && (!loadedPubKey || loadedPubKey.substring(0, 20) === debugInfo.publishable.raw.substring(0, 20))) ? "text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full" : "text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full"}>
              {(debugInfo.match && (!loadedPubKey || loadedPubKey.substring(0, 20) === debugInfo.publishable.raw.substring(0, 20))) ? "✅ MATCHED" : "⚠️ MISMATCHED"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="font-bold text-neutral-400 uppercase text-[9px]">Server Pub Key Prefix</p>
              <p className="font-mono text-neutral-800 text-[10px] break-all">{debugInfo.publishable.raw}</p>
              <p className="mt-0.5 text-[9px] text-neutral-500">
                Mode: {debugInfo.publishable.isLive ? <span className="font-bold text-red-600 text-[10px]">LIVE</span> : <span className="font-bold text-amber-600 text-[10px]">TEST</span>} (Len: {debugInfo.publishable.length})
              </p>
            </div>
            <div>
              <p className="font-bold text-neutral-400 uppercase text-[9px]">Server Secret Key Prefix</p>
              <p className="font-mono text-neutral-800 text-[10px] break-all">{debugInfo.secret.raw}</p>
              <p className="mt-0.5 text-[9px] text-neutral-500">
                Mode: {debugInfo.secret.isLive ? <span className="font-bold text-red-600 text-[10px]">LIVE</span> : <span className="font-bold text-amber-600 text-[10px]">TEST</span>} (Len: {debugInfo.secret.length})
              </p>
            </div>
            {loadedPubKey && (
              <div className="col-span-2 pt-1 border-t border-dashed border-neutral-200">
                <p className="font-bold text-neutral-400 uppercase text-[9px]">Browser's Loaded Pub Key</p>
                <p className="font-mono text-neutral-800 text-[10px] break-all">
                  {loadedPubKey.substring(0, 24)}... (Len: {loadedPubKey.length})
                </p>
                <p className="mt-0.5 text-[9px] text-neutral-500 font-medium">
                  Source: <span className="text-neutral-900 font-bold">{keySource}</span> | matches Server Pub Key:{" "}
                  {loadedPubKey.substring(0, 20) === debugInfo.publishable.raw.substring(0, 20) ? (
                    <span className="font-bold text-emerald-600">Yes</span>
                  ) : (
                    <span className="font-bold text-red-600">No (Mismatch/Cache Issue)</span>
                  )}
                </p>
              </div>
            )}
          </div>
          <p className="italic text-[10px] text-neutral-500 leading-normal pt-1.5 border-t border-neutral-100">
            {!(debugInfo.match && (!loadedPubKey || loadedPubKey.substring(0, 20) === debugInfo.publishable.raw.substring(0, 20))) 
              ? "ম্যাচিং সতর্কবার্তা: আপনার ব্রাউজারের সাথে সার্ভারের কি-জোড় সঠিক মিলছে না। আপনার .env ফাইলে STRIPE_SECRET_KEY এবং VITE_STRIPE_PUBLISHABLE_KEY একই একাউন্ট হতে নিয়ে রিফ্রেশ দিন এবং ব্রাউজার ক্যাশ পরিষ্কার করুন।"
              : "একই একাউন্ট: পাবলিশেবল কি ও সিক্রেট কি একই একাউন্টের কি সাবসেট। অনুগ্রহ করে নিশ্চিত হোন যে আপনার Stripe Web Dashboard-এ কার্ড টাইপ ও কানেক্ট অপশনসমূহ সচল রয়েছে।"}
          </p>
        </div>
      )}

      <button 
        type="submit"
        disabled={isProcessing || !stripe}
        className="w-full rounded-2xl bg-neutral-900 py-4 font-bold text-white shadow-xl shadow-neutral-900/10 hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
        {isProcessing ? "Processing Securely..." : `Subscribe & Pay $${amount}`}
      </button>

      <button 
        type="button"
        onClick={onCancel}
        disabled={isProcessing}
        className="w-full py-2 text-xs font-bold text-neutral-400 hover:text-neutral-900 transition-all"
      >
        Cancel
      </button>

      <div className="flex items-center justify-center gap-2 text-neutral-400">
        <Lock size={12} />
        <p className="text-[10px] uppercase font-bold tracking-widest">Stripe Secure 256-bit Encryption</p>
      </div>
    </form>
  );
}

export default function BillingPage() {
  const { user, updateProfile, refreshProfile } = useAuth();
  const [currentPlan, setCurrentPlan] = useState(user?.plan_name || 'Credit Repair Subscription');
  const [amount, setAmount] = useState(user?.sub_amount || 149);
  const [paymentMethod, setPaymentMethod] = useState('Chase •••• 1234 (ACH)');
  const [status, setStatus] = useState<'active' | 'cancelled' | 'pending'>(user?.sub_status as any || 'active');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [isPlaidConnecting, setIsPlaidConnecting] = useState(false);
  const [systemSettings, setSystemSettings] = useState<any>(null);
  const [stripePromise, setStripePromise] = useState<any>(null);

  const expiryDate = user?.sub_expiry ? new Date(user.sub_expiry) : null;
  const today = new Date();
  const isExpired = !user?.sub_status || user?.sub_status !== 'active' || (expiryDate ? today > expiryDate : true);
  
  let daysLeft = 0;
  if (expiryDate && !isExpired) {
    const diffTime = expiryDate.getTime() - today.getTime();
    daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  const [invoices, setInvoices] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [loadedPubKey, setLoadedPubKey] = useState<string>('');
  const [keySource, setKeySource] = useState<string>('');

  const loadDynamicStripe = async () => {
    try {
      const res = await fetch(`/api/stripe/publishable-key?tenantId=${user?.tenantId || ""}`);
      if (res.ok) {
        const data = await res.json();
        if (data.publishableKey) {
          console.log("Loaded Stripe publishable key dynamically from server:", data.publishableKey);
          setLoadedPubKey(data.publishableKey);
          setKeySource("Server API Gateway");
          setStripePromise(loadStripe(data.publishableKey));
          return;
        }
      }
    } catch (err) {
      console.warn("Failed to fetch publishable key dynamically:", err);
    }
    
    // Fallback to client-side environment variable if API is not available or empty
    const envKey = (import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY;
    if (envKey) {
      console.log("Using environment variable fallback for Stripe publishable key:", envKey);
      setLoadedPubKey(envKey);
      setKeySource("Vite Bundle Fallback");
      setStripePromise(loadStripe(envKey));
    } else {
      console.error("No Stripe publishable key found! Payments will fail.");
      setKeySource("None Found");
    }
  };

  const fetchSystemSettings = async () => {
    try {
      const res = await fetch('/api/admin/system-settings');
      if (res.ok) {
        const data = await res.json();
        setSystemSettings(data);
      }
    } catch (e) {
      console.error("Failed to fetch system settings in BillingPage:", e);
    }
  };

  useEffect(() => {
    if (user) {
      if (user.plan_name) setCurrentPlan(user.plan_name);
      if (user.sub_amount) setAmount(user.sub_amount);
      if (user.sub_status) setStatus(user.sub_status as any);
      fetchSystemSettings();
      fetchInvoices();
      fetchPaymentMethods();
      loadDynamicStripe();
    }
  }, [user]);

  const fetchPaymentMethods = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/client/payment-methods/${user.uid}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const card = data[0].card;
          setPaymentMethod(`${card.brand.toUpperCase()} •••• ${card.last4}`);
        }
      }
    } catch (e) {
      console.error("Failed to fetch payment methods:", e);
    }
  };

  const fetchInvoices = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/users/${user.uid}/payments`);
      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
      }
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const updateSubscriptionInDB = async (newPlan: string, newAmount: number, newStatus: string) => {
    if (!user) return;
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          planName: newPlan,
          amount: newAmount,
          status: newStatus
        })
      });

      if (!response.ok) throw new Error("Failed to update subscription");
      
      // Update local state and context
      await updateProfile({
        plan_name: newPlan,
        sub_amount: newAmount,
        sub_status: newStatus as any
      });
      
      return true;
    } catch (error) {
      console.error(error);
      alert("Billing update failed. Please try again.");
      return false;
    }
  };

  const handleCancelSubscription = async () => {
    if (window.confirm("Are you sure you want to cancel? Your credit repair progress will be paused.")) {
      setIsProcessing(true);
      const success = await updateSubscriptionInDB(currentPlan, amount, 'canceled');
      if (success) {
        setStatus('canceled' as any);
        alert("Subscription cancelled successfully.");
      }
      setIsProcessing(false);
    }
  };

  const handlePlanChange = (newPlan: string, newAmount: number) => {
    setCurrentPlan(newPlan);
    setAmount(newAmount);
    setShowPlanModal(false);
    setShowCardModal(true);
  };

  const handleReactivate = () => {
    setShowCardModal(true);
  };

  const handleConnectBank = () => {
    setIsPlaidConnecting(true);
    // Simulating Plaid Link
    setTimeout(async () => {
      await updateProfile({ plaidConnected: true, achAuthorized: true });
      setIsPlaidConnecting(false);
      setPaymentMethod('Connected Bank (ACH)');
      alert("Bank account connected successfully via Plaid!");
    }, 2000);
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    // Simulating Card Verification
    setTimeout(async () => {
      await updateProfile({ achAuthorized: true });
      setPaymentMethod('Visa ending in 4242');
      setShowCardModal(false);
      setIsProcessing(false);
      alert("Payment card added successfully!");
    }, 2000);
  };

  const downloadReceipt = (invoiceId: string) => {
    alert(`Downloading receipt for ${invoiceId}...`);
    // Logic for PDF download would go here
  };

  return (
    <DashboardLayout>
      <div className="space-y-10 max-w-5xl mx-auto">
        {isExpired && (
          <div className="p-6 rounded-[24px] bg-red-50 border border-red-200 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="space-y-1">
              <span className="font-extrabold text-[10px] bg-red-650 bg-red-500 text-white rounded-full px-2.5 py-0.5 uppercase tracking-widest leading-none">
                LOCKED / EXPIRED
              </span>
              <h3 className="text-lg font-bold text-red-950 font-display mt-2">আপনার মেয়াদের মেয়াদ শেষ হয়েছে!</h3>
              <p className="text-xs text-red-700 font-medium leading-relaxed">ড্যাশবোর্ড আনলক করার জন্য অনুগ্রহ করে কার্ডের মাধ্যমে পেমেন্ট সম্পন্ন করুন। যেকোনো একটি প্ল্যান বাছাই করে সাথে সাথে ৩০ দিনের এক্সেস গ্রহণ করুন।</p>
            </div>
            <button
              onClick={() => setShowPlanModal(true)}
              className="px-5 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all uppercase shrink-0"
            >
              Subscription Plans
            </button>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <h1 className="font-display text-4xl font-bold tracking-tight text-neutral-900">Billing & Payments</h1>
          <p className="text-neutral-500">Manage your subscription and view payment history.</p>
        </div>

        {/* Plan Summary Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
           <div className="md:col-span-2 space-y-6">
              <div className="rounded-3xl border border-neutral-100 bg-white p-8 shadow-sm relative overflow-hidden">
                {isProcessing && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                    <Loader2 className="animate-spin text-neutral-900" size={32} />
                  </div>
                )}
                
                <div className="flex items-start justify-between">
                  <div>
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-tight",
                      !isExpired ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                    )}>
                      {!isExpired ? `${daysLeft} days active` : 'Expired / Locked'}
                    </span>
                    <h2 className="mt-4 font-display text-2xl font-bold text-neutral-900">{currentPlan}</h2>
                    <p className="text-neutral-500">
                      {!isExpired 
                        ? `Your next billing date is ${expiryDate ? expiryDate.toLocaleDateString() : 'N/A'}.` 
                        : 'পেমেন্ট সম্পন্ন করে আপনার ড্যাশবোর্ডটি ৩০ দিনের জন্য সচল করুন।'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-3xl font-bold text-neutral-900">${amount}</p>
                    <p className="text-xs font-medium text-neutral-400">per month</p>
                  </div>
                </div>
                
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="flex items-center gap-3 p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
                      <div className="size-10 rounded-xl bg-white flex items-center justify-center text-neutral-900 shadow-sm">
                        <CreditCard size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-neutral-400 uppercase">Payment Method</p>
                        <p className="text-sm font-bold text-neutral-900">{paymentMethod}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3 p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
                      <div className="size-10 rounded-xl bg-white flex items-center justify-center text-neutral-900 shadow-sm">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-neutral-400 uppercase">Billing Cycle</p>
                        <p className="text-sm font-bold text-neutral-900">Monthly auto-pay</p>
                      </div>
                   </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-4 pt-8 border-t border-neutral-100">
                   <button 
                    onClick={() => setShowPlanModal(true)}
                    className="rounded-xl bg-neutral-900 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-neutral-800"
                   >
                    Change Plan / Subscribe
                   </button>
                   {status === 'active' && !isExpired ? (
                     <button 
                      onClick={handleCancelSubscription}
                      className="rounded-xl border border-neutral-200 px-6 py-2.5 text-sm font-bold text-neutral-600 transition-all hover:bg-neutral-50 hover:text-neutral-900"
                     >
                      Cancel Subscription
                     </button>
                   ) : (
                     <button 
                      onClick={handleReactivate}
                      className="rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-2.5 text-sm font-bold text-emerald-600 transition-all hover:bg-emerald-100"
                     >
                      Pay & Activate Account
                     </button>
                   )}
                </div>
              </div>
           </div>

           <div className="space-y-6">
              <div className="rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-neutral-900">
                   <AlertCircle size={20} className="text-amber-500" />
                   <h3 className="font-display text-lg font-bold">Payment Support</h3>
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed italic">
                  Service will be automatically paused if an ACH payment fails. Please ensure sufficient funds are available on your billing date.
                </p>
                <div className="mt-6 flex items-center gap-2 text-xs font-bold text-neutral-900 uppercase tracking-wider cursor-pointer hover:underline">
                   <ExternalLink size={14} />
                   <span>View Billing Policy</span>
                </div>
              </div>

              <div className="rounded-3xl border border-emerald-100 bg-emerald-50/50 p-6 shadow-sm">
                <h3 className="font-display text-sm font-bold text-emerald-900 mb-2">Need a higher limit?</h3>
                <p className="text-xs text-emerald-800/80 mb-4">Contact your account manager for custom volume credit repair batches.</p>
                <button className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700">Contact Sales</button>
              </div>
           </div>
        </div>

        {/* Payment Methods Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Active Method */}
          <div className="bg-white rounded-[32px] border border-neutral-100 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold font-display text-neutral-900">Payment Sources</h3>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                <ShieldCheck size={12} />
                Secure Autopay
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-6 rounded-2xl border-2 border-neutral-900 bg-neutral-50/50">
                 <div className="flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-neutral-900 flex items-center justify-center text-white">
                       {paymentMethod.includes('Bank') ? <Building2 size={24} /> : <CreditCard size={24} />}
                    </div>
                    <div>
                       <p className="font-bold text-neutral-900">{paymentMethod}</p>
                       <p className="text-xs text-neutral-400 capitalize">Default payment source</p>
                    </div>
                 </div>
                 <div className="text-emerald-500">
                    <CheckCircle2 size={24} />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <button 
                  onClick={() => setShowCardModal(true)}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 p-4 font-bold text-sm text-neutral-900 hover:bg-neutral-50 transition-all"
                 >
                   <Plus size={18} /> Add Card
                 </button>
                 <button 
                  onClick={handleConnectBank}
                  disabled={isPlaidConnecting}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 p-4 font-bold text-sm text-neutral-900 hover:bg-neutral-50 transition-all disabled:opacity-50"
                 >
                   {isPlaidConnecting ? <Loader2 className="animate-spin" size={18} /> : <Building2 size={18} />}
                   Connect Bank
                 </button>
              </div>
            </div>
          </div>

          {/* Billing Protection */}
          <div className="bg-neutral-900 rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
             <div className="relative z-10">
                <h3 className="text-xl font-bold mb-4 font-display">Financial Security</h3>
                <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
                  Your payments are protected by 256-bit encryption. We never store your full card details on our servers.
                </p>
                <div className="space-y-4">
                   <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-white/10 flex items-center justify-center text-emerald-400">
                         <ShieldCheck size={18} />
                      </div>
                      <span className="text-sm font-medium">PCI-DSS Compliant Infrastructure</span>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-white/10 flex items-center justify-center text-emerald-400">
                         <Lock size={18} />
                      </div>
                      <span className="text-sm font-medium">Auto-Billing Frequency: Monthly</span>
                   </div>
                </div>
             </div>
             <div className="mt-8 pt-6 border-t border-white/10 relative z-10">
                <div className="flex items-center justify-between">
                   <span className="text-xs text-neutral-500 italic uppercase tracking-wider font-bold">Encrypted via Stripe</span>
                   <div className="flex gap-2">
                      <div className="size-6 bg-white/10 rounded"></div>
                      <div className="size-6 bg-white/10 rounded"></div>
                      <div className="size-6 bg-white/10 rounded"></div>
                   </div>
                </div>
             </div>
             <div className="absolute -right-20 -bottom-20 size-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="rounded-3xl border border-neutral-100 bg-white shadow-sm overflow-hidden">
          <div className="p-8 pb-4">
             <h3 className="font-display text-xl font-bold text-neutral-900">Invoice History</h3>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead>
                  <tr className="bg-neutral-50/50 text-xs font-bold uppercase tracking-wider text-neutral-400">
                    <th className="px-8 py-4">Invoice ID</th>
                    <th className="px-8 py-4">Date</th>
                    <th className="px-8 py-4">Amount</th>
                    <th className="px-8 py-4">Status</th>
                    <th className="px-8 py-4 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-sm">
                  {loadingInvoices ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-10 text-center">
                        <Loader2 className="animate-spin text-neutral-400 mx-auto" size={24} />
                      </td>
                    </tr>
                  ) : invoices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-10 text-center text-neutral-400 italic">
                        No payment history found.
                      </td>
                    </tr>
                  ) : invoices.map(inv => (
                    <tr key={inv.id} className="group hover:bg-neutral-50/50 transition-colors">
                      <td className="px-8 py-4 font-bold text-neutral-900">#{inv.id.substring(0, 8).toUpperCase()}</td>
                      <td className="px-8 py-4 text-neutral-500">{new Date(inv.paymentDate).toLocaleDateString()}</td>
                      <td className="px-8 py-4 font-medium text-neutral-900">${inv.amount}</td>
                      <td className="px-8 py-4 text-left">
                         <div className={cn(
                           "flex items-center gap-1.5 font-bold",
                           inv.status === 'success' ? "text-emerald-600" : 
                           inv.status === 'failed' ? "text-red-600" : "text-amber-600"
                         )}>
                            {inv.status === 'success' ? <CheckCircle2 size={14} /> : 
                             inv.status === 'failed' ? <XCircle size={14} /> : <AlertCircle size={14} />}
                            <span className="uppercase text-[10px] tracking-tight">{inv.status}</span>
                         </div>
                      </td>
                      <td className="px-8 py-4 text-right">
                         <button 
                          onClick={() => downloadReceipt(inv.id)}
                          className="text-neutral-400 hover:text-neutral-900 transition-colors"
                         >
                            <Download size={18} />
                         </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
          <div className="p-4 border-t border-neutral-100 text-center">
             <p className="text-xs text-neutral-400 font-medium tracking-tight italic">All transactions are secured and encrypted.</p>
          </div>
        </div>
      </div>

      {/* Basic Plan Modal Overlay */}
      <AnimatePresence>
        {showPlanModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPlanModal(false)}
              className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[32px] p-8 shadow-2xl"
            >
              <h2 className="font-display text-2xl font-bold text-neutral-900 mb-2">Upgrade Your Plan</h2>
              <p className="text-neutral-500 text-sm mb-6">Choose a plan that fits your credit repair needs.</p>
              
              <div className="space-y-3">
                {[
                  { name: 'Standard Credit Repair', price: systemSettings?.planPriceStandard !== undefined ? parseFloat(systemSettings.planPriceStandard) : 99, desc: 'Basic dispute handling' },
                  { name: 'Premium Credit Repair', price: systemSettings?.planPricePremium !== undefined ? parseFloat(systemSettings.planPricePremium) : 149, desc: 'Advanced batch processing' },
                  { name: 'Elite Credit Sweep', price: systemSettings?.planPriceElite !== undefined ? parseFloat(systemSettings.planPriceElite) : 299, desc: 'Full legal credit protection' }
                ].map((p) => (
                  <button
                    key={p.name}
                    onClick={() => handlePlanChange(p.name, p.price)}
                    className={cn(
                      "w-full text-left p-4 rounded-2xl border transition-all hover:bg-neutral-50",
                      currentPlan === p.name ? "border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900" : "border-neutral-100"
                    )}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-neutral-900">{p.name}</p>
                        <p className="text-xs text-neutral-500">{p.desc}</p>
                      </div>
                      <p className="font-display text-xl font-bold text-neutral-900">${p.price}<span className="text-xs font-normal text-neutral-400">/mo</span></p>
                    </div>
                  </button>
                ))}
              </div>
              
              <button 
                onClick={() => setShowPlanModal(false)}
                className="mt-6 w-full py-3 text-sm font-bold text-neutral-500 hover:text-neutral-900"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}

        {/* Add Card Modal */}
        {showCardModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="w-full max-w-md bg-white rounded-[32px] overflow-hidden shadow-2xl p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold font-display text-neutral-900">Configure Billing</h3>
                <button onClick={() => setShowCardModal(false)} className="text-neutral-400 hover:text-neutral-900">
                  <XCircle size={24} />
                </button>
              </div>

              {stripePromise ? (
                <Elements stripe={stripePromise}>
                  <AddCardForm 
                    userId={user?.uid}
                    email={user?.email}
                    tenantId={user?.tenantId}
                    amount={amount}
                    planName={currentPlan}
                    loadedPubKey={loadedPubKey}
                    keySource={keySource}
                    onCancel={() => setShowCardModal(false)} 
                    onSuccess={(typeOrPmId: string, details?: any) => {
                      setShowCardModal(false);
                      fetchPaymentMethods();
                      fetchInvoices();
                      refreshProfile();
                      if (typeOrPmId === 'bank') {
                        alert(`ACH পেমেন্ট সফল হয়েছে! আপনার ব্যাংক অ্যাকাউন্ট (${details?.bankName || 'Bank'} ending in ${details?.last4 || ''}) কানেক্ট ও চার্জ করা হয়েছে।`);
                      } else {
                        alert("Subscription activated and card saved successfully!");
                      }
                    }} 
                  />
                </Elements>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <Loader2 className="animate-spin text-neutral-400" size={32} />
                  <p className="text-xs text-neutral-400 font-medium animate-pulse">Loading secure payment portal...</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
