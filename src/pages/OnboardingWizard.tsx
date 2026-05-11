import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight, ArrowLeft, Building2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { SubscriptionPlan } from '../types';
import { useAuth } from '../context/AuthContext';

const steps = [
  { id: 1, title: 'Select Plan', description: 'Choose your subscription' },
  { id: 2, title: 'Connect Bank', description: 'Setup ACH via Plaid' },
  { id: 3, title: 'ACH Authorization', description: 'Digital agreement' },
];

export default function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [plaidConnected, setPlaidConnected] = useState(false);
  const [achAgreed, setAchAgreed] = useState(false);
  const navigate = useNavigate();

  const { user } = useAuth();

  const handleNext = async () => {
    if (currentStep < steps.length) {
      const nextStep = currentStep + 1;
      // Sync progress with DB
      if (user) {
        try {
          const response = await fetch(`/api/users/${user.uid}/onboarding`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              step: nextStep, 
              plaidConnected: nextStep > 2 || plaidConnected,
              achAuthorized: nextStep > 3 || achAgreed 
            }),
          });
          if (!response.ok) throw new Error('Failed to update progress on server');
        } catch (error) {
          console.error("Failed to sync progress:", error);
          alert("Warning: Could not save progress to database. Please check your connection.");
        }
      }
      setCurrentStep(nextStep);
    } else {
      // Final setup on completion: Create Subscription
      if (user && plan) {
        try {
          const response = await fetch('/api/subscriptions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.uid,
              planName: plan,
              amount: plan === SubscriptionPlan.BUSINESS_FUNDING ? 299 : 149
            }),
          });
          if (!response.ok) throw new Error('Failed to create subscription on server');
        } catch (error) {
          console.error("Failed to create subscription:", error);
          alert("Could not initialize subscription. Please contact support.");
          return; // Stop if subscription fails
        }
      }
      navigate('/dashboard');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      {/* Header */}
      <header className="flex h-20 items-center justify-between border-b border-neutral-100 bg-white px-6 lg:px-20">
         <div className="flex items-center gap-2 font-display text-xl font-bold tracking-tight text-neutral-900">
            <div className="size-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white font-display">FTF</div>
            <span>FTF Consulting</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-neutral-500">Step {currentStep} of {steps.length}</span>
            <div className="flex gap-1">
              {steps.map((s) => (
                <div key={s.id} className={cn("h-1.5 w-8 rounded-full bg-neutral-100 transition-all", s.id <= currentStep ? "bg-neutral-900" : "")} />
              ))}
            </div>
          </div>
      </header>

      <main className="flex flex-1 items-center justify-center p-6 bg-zinc-50/50">
        <div className="w-full max-w-4xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="rounded-3xl border border-neutral-100 bg-white p-8 lg:p-12 shadow-sm"
            >
              {currentStep === 1 && (
                <div className="space-y-8">
                  <div className="text-center lg:text-left">
                    <h2 className="font-display text-3xl font-bold text-neutral-900">Select your service plan</h2>
                    <p className="mt-2 text-neutral-500">Service starts only after auto-pay enrollment.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {[
                      {
                        id: SubscriptionPlan.CREDIT_REPAIR,
                        price: 149,
                        features: ['Credit analysis', 'Dispute letters', 'Score tracking'],
                        icon: ShieldCheck
                      },
                      {
                        id: SubscriptionPlan.BUSINESS_FUNDING,
                        price: 299,
                        features: ['Business credit setup', 'Funding strategy', 'Lender matching'],
                        icon: Building2
                      }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setPlan(item.id)}
                        className={cn(
                          "group relative flex flex-col rounded-2xl border-2 p-6 text-left transition-all",
                          plan === item.id 
                            ? "border-neutral-900 bg-neutral-900 text-white shadow-xl" 
                            : "border-neutral-100 bg-white text-neutral-900 hover:border-neutral-200"
                        )}
                      >
                        <div className={cn("size-10 rounded-xl flex items-center justify-center mb-4 transition-colors", plan === item.id ? "bg-white/10 text-white" : "bg-neutral-50 text-neutral-900")}>
                          <item.icon size={24} />
                        </div>
                        <h3 className="text-lg font-bold">{item.id}</h3>
                        <p className={cn("mt-1 text-2xl font-bold font-display", plan === item.id ? "text-white" : "text-neutral-900")}>${item.price}<span className="text-sm font-normal">/month</span></p>
                        <ul className="mt-4 space-y-2">
                          {item.features.map(f => (
                            <li key={f} className="flex items-center gap-2 text-sm opacity-80">
                              <Check size={14} className={plan === item.id ? "text-white" : "text-emerald-500"} />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-8 text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-neutral-50 text-neutral-900">
                    <Building2 size={40} />
                  </div>
                  <div className="space-y-2">
                    <h2 className="font-display text-3xl font-bold text-neutral-900">Connect your bank</h2>
                    <p className="text-neutral-500">We use Plaid to securely connect your bank account for ACH payments.</p>
                  </div>
                  
                  {plaidConnected ? (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex flex-col items-center animate-in fade-in zoom-in duration-300">
                       <CheckCircle2 size={48} className="text-emerald-500 mb-2" />
                       <span className="text-emerald-900 font-bold">Bank connected successfully</span>
                       <span className="text-emerald-600 text-sm">Chase Checking •••• 1234</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <button
                        onClick={() => setPlaidConnected(true)}
                        className="mx-auto flex w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-neutral-900 py-4 text-sm font-bold text-white shadow-lg transition-transform active:scale-95"
                      >
                        Connect via Plaid
                      </button>
                      <p className="text-xs text-neutral-400">Your credentials never touch our servers. Encrypted and secure.</p>
                    </div>
                  )}
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center lg:text-left">
                    <h2 className="font-display text-3xl font-bold text-neutral-900">ACH Authorization Agreement</h2>
                    <p className="mt-2 text-neutral-500">Please review and sign the recurring payment authorization.</p>
                  </div>
                  
                  <div className="h-48 overflow-y-auto rounded-xl border border-neutral-100 bg-neutral-50 p-6 text-xs text-neutral-600">
                    <h4 className="font-bold text-neutral-900 mb-2">Electronic Check (ACH) Recurring Payment Authorization</h4>
                    <p className="mb-4">
                      By checking the box below, you authorize FTF Consulting to store your bank account information and to initiate recurring ACH debit entries to the specified bank account in the amount of your selected plan (${plan === SubscriptionPlan.BUSINESS_FUNDING ? '299' : '149'}).
                    </p>
                    <p className="mb-4">
                      You understand that this authorization will remain in effect until you cancel your subscription. Payments will occur on the same day each month starting from today.
                    </p>
                    <p className="mb-4">
                      FTF Consulting reserves the right to pause service immediately if a payment fails or is disputed.
                    </p>
                  </div>

                  <label className="flex items-start gap-3 p-4 rounded-xl border border-neutral-100 bg-neutral-50/50 cursor-pointer transition-colors hover:bg-neutral-50">
                    <input 
                      type="checkbox" 
                      checked={achAgreed}
                      onChange={(e) => setAchAgreed(e.target.checked)}
                      className="mt-0.5 h-5 w-5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900" 
                    />
                    <span className="text-sm font-medium text-neutral-700 leading-tight">
                      I understand and authorize FTF Consulting to charge my bank account automatically each month according to the terms above.
                    </span>
                  </label>

                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
                     <ShieldCheck className="text-amber-600 shrink-0" size={20} />
                     <p className="text-xs text-amber-900 font-medium leading-relaxed">
                        Important: Your credit repair or business funding services will be activated ONLY after this authorization is submitted.
                     </p>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="mt-12 flex items-center justify-between pt-8 border-t border-neutral-100">
                <button
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className="flex items-center gap-2 text-sm font-bold text-neutral-500 transition-colors hover:text-neutral-900 disabled:opacity-0"
                >
                  <ArrowLeft size={18} />
                  Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={
                    (currentStep === 1 && !plan) ||
                    (currentStep === 2 && !plaidConnected) ||
                    (currentStep === 3 && !achAgreed)
                  }
                  className="flex items-center gap-2 rounded-xl bg-neutral-900 px-8 py-3.5 text-sm font-bold text-white shadow-xl transition-all hover:bg-neutral-800 disabled:opacity-30"
                >
                  {currentStep === steps.length ? 'Complete Enrollment' : 'Continue'}
                  <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
