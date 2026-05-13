import { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { CreditCard, Download, ExternalLink, Calendar, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function BillingPage() {
  const [currentPlan, setCurrentPlan] = useState('Credit Repair Subscription');
  const [amount, setAmount] = useState(149);
  const [paymentMethod, setPaymentMethod] = useState('Chase •••• 1234 (ACH)');
  const [status, setStatus] = useState<'active' | 'cancelled' | 'pending'>('active');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);

  const [invoices, setInvoices] = useState([
    { id: 'FTF-0012', date: 'Apr 24, 2026', amount: '$149.00', status: 'paid' },
    { id: 'FTF-0010', date: 'Mar 24, 2026', amount: '$149.00', status: 'paid' },
    { id: 'FTF-0008', date: 'Feb 24, 2026', amount: '$149.00', status: 'paid' },
  ]);

  const handleCancelSubscription = () => {
    if (window.confirm("Are you sure you want to cancel? Your credit repair progress will be paused.")) {
      setIsProcessing(true);
      setTimeout(() => {
        setStatus('cancelled');
        setIsProcessing(false);
        alert("Subscription cancelled successfully.");
      }, 1500);
    }
  };

  const handlePlanChange = (newPlan: string, newAmount: number) => {
    setIsProcessing(true);
    setShowPlanModal(false);
    setTimeout(() => {
      setCurrentPlan(newPlan);
      setAmount(newAmount);
      setIsProcessing(false);
      alert(`Plan successfully upgraded to ${newPlan}`);
    }, 1500);
  };

  const downloadReceipt = (invoiceId: string) => {
    alert(`Downloading receipt for ${invoiceId}...`);
    // Logic for PDF download would go here
  };

  return (
    <DashboardLayout>
      <div className="space-y-10 max-w-5xl mx-auto">
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
                      status === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                    )}>
                      {status === 'active' ? 'Active Plan' : 'Cancelled'}
                    </span>
                    <h2 className="mt-4 font-display text-2xl font-bold text-neutral-900">{currentPlan}</h2>
                    <p className="text-neutral-500">
                      {status === 'active' 
                        ? 'Your next billing date is May 24, 2026.' 
                        : 'Your service will end on the current billing cycle.'}
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
                    disabled={status !== 'active'}
                    onClick={() => setShowPlanModal(true)}
                    className="rounded-xl bg-neutral-900 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                    Change Plan
                   </button>
                   {status === 'active' ? (
                     <button 
                      onClick={handleCancelSubscription}
                      className="rounded-xl border border-neutral-200 px-6 py-2.5 text-sm font-bold text-neutral-600 transition-all hover:bg-neutral-50 hover:text-neutral-900"
                     >
                      Cancel Subscription
                     </button>
                   ) : (
                     <button 
                      onClick={() => setStatus('active')}
                      className="rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-2.5 text-sm font-bold text-emerald-600 transition-all hover:bg-emerald-100"
                     >
                      Reactive Account
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

        {/* Invoices Table */}
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
                <tbody className="divide-y divide-neutral-100 text-sm italic">
                  {invoices.map(inv => (
                    <tr key={inv.id} className="group hover:bg-neutral-50/50 transition-colors">
                      <td className="px-8 py-4 font-bold text-neutral-900">{inv.id}</td>
                      <td className="px-8 py-4 text-neutral-500">{inv.date}</td>
                      <td className="px-8 py-4 font-medium text-neutral-900">{inv.amount}</td>
                      <td className="px-8 py-4 text-left">
                         <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                            <CheckCircle2 size={14} />
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
                  { name: 'Standard Credit Repair', price: 99, desc: 'Basic dispute handling' },
                  { name: 'Premium Credit Repair', price: 149, desc: 'Advanced batch processing' },
                  { name: 'Elite Credit Sweep', price: 299, desc: 'Full legal credit protection' }
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
      </AnimatePresence>
    </DashboardLayout>
  );
}
