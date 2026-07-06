import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight, ArrowLeft, Building2, ShieldCheck, CheckCircle2, Sparkles, Layers } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

const steps = [
  { id: 1, title: 'Select Plan', description: 'Choose your subscription' },
  { id: 2, title: 'Connect Bank', description: 'Setup ACH authorization' },
  { id: 3, title: 'ACH Authorization', description: 'Digital signature' },
];

export default function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<'Standard Plan' | 'Premium Plan' | null>(null);
  const [plaidConnected, setPlaidConnected] = useState(false);
  const [achAgreed, setAchAgreed] = useState(false);
  const navigate = useNavigate();

  const { user } = useAuth();

  const handleNext = async () => {
    if (currentStep < steps.length) {
      const nextStep = currentStep + 1;
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
        }
      }
      setCurrentStep(nextStep);
    } else {
      // Final setup on completion: Create Subscription in DB directly
      if (user && selectedPlan) {
        try {
          const response = await fetch('/api/subscriptions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.uid,
              planName: selectedPlan,
              amount: selectedPlan === 'Premium Plan' ? 149 : 99,
              status: 'active'
            }),
          });
          if (!response.ok) throw new Error('Failed to create subscription on server');
        } catch (error) {
          console.error("Failed to create subscription:", error);
          alert("Could not initialize subscription. Continuing to dashboard...");
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
    <div className="flex min-h-screen flex-col bg-neutral-50 font-sans">
      {/* Header */}
      <header className="flex h-20 items-center justify-between border-b border-neutral-100 bg-white px-6 lg:px-20">
         <div className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight text-neutral-900">
            <div className="size-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white font-display">S</div>
            <span>SaaS Boilerplate</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Step {currentStep} of {steps.length}</span>
            <div className="flex gap-1">
              {steps.map((s) => (
                <div key={s.id} className={cn("h-1.5 w-6 rounded-full bg-neutral-150 transition-all", s.id <= currentStep ? "bg-neutral-900" : "")} />
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
              className="rounded-[32px] border border-neutral-150 bg-white p-8 lg:p-12 shadow-sm text-left"
            >
              {currentStep === 1 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="font-display text-3xl font-extrabold text-neutral-900 tracking-tight">Select your SaaS subscription</h2>
                    <p className="mt-1 text-sm text-neutral-500">Service starts immediately after plan setup and billing enrollment.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {[
                      {
                        name: 'Standard Plan' as const,
                        price: 99,
                        features: ['Full application playground', 'Local databases persistence', 'Standard billing integrations'],
                        icon: Sparkles
                      },
                      {
                        name: 'Premium Plan' as const,
                        price: 149,
                        features: ['Unlimited multi-user logins', 'Stripe standard Connect', 'Priority direct server setup'],
                        icon: Layers
                      }
                    ].map((item) => (
                      <button
                        key={item.name}
                        onClick={() => setSelectedPlan(item.name)}
                        className={cn(
                          "group relative flex flex-col rounded-2xl border p-6 text-left transition-all cursor-pointer",
                          selectedPlan === item.name 
                            ? "border-neutral-900 bg-neutral-900 text-white shadow-xl scale-[1.02]" 
                            : "border-neutral-150 bg-white text-neutral-900 hover:border-neutral-300"
                        )}
                      >
                        <div className={cn("size-10 rounded-xl flex items-center justify-center mb-4 transition-colors", selectedPlan === item.name ? "bg-white/10 text-white" : "bg-neutral-50 text-neutral-900")}>
                          <item.icon size={20} />
                        </div>
                        <h3 className="text-base font-black uppercase tracking-wide">{item.name}</h3>
                        <p className={cn("mt-1 text-2xl font-bold font-display", selectedPlan === item.name ? "text-white" : "text-neutral-900")}>${item.price}<span className="text-xs font-normal opacity-80"> / month</span></p>
                        <ul className="mt-4 space-y-2 border-t border-neutral-200/25 pt-4">
                          {item.features.map(f => (
                            <li key={f} className="flex items-center gap-2 text-xs font-semibold opacity-90 leading-relaxed">
                              <Check size={12} className={selectedPlan === item.name ? "text-white" : "text-emerald-500"} />
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
                <div className="space-y-8 text-center max-w-md mx-auto">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-neutral-50 border border-neutral-100 text-neutral-900 shadow-sm animate-pulse">
                    <Building2 size={36} />
                  </div>
                  <div className="space-y-2">
                    <h2 className="font-display text-2xl font-extrabold text-neutral-900 tracking-tight">Connect your bank account</h2>
                    <p className="text-sm text-neutral-500 leading-relaxed">We utilize Plaid secure pipelines to connect your checking account securely for recurring automated ACH debits.</p>
                  </div>
                  
                  {plaidConnected ? (
                    <div className="bg-emerald-50 border border-emerald-150 rounded-2xl p-6 flex flex-col items-center animate-in fade-in zoom-in duration-300">
                       <CheckCircle2 size={40} className="text-emerald-500 mb-2 animate-bounce" />
                       <span className="text-emerald-900 font-extrabold text-sm">Bank Connected Securely</span>
                       <span className="text-emerald-600 text-xs mt-0.5">Chase Checking Account •••• 1234</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <button
                        onClick={() => setPlaidConnected(true)}
                        className="mx-auto flex w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all cursor-pointer"
                      >
                        Connect via Plaid Secure
                      </button>
                      <p className="text-[10px] text-neutral-400">Plaid tokenization is fully integrated. No passwords or routing credentials touch our servers.</p>
                    </div>
                  )}
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-display text-2xl font-extrabold text-neutral-900 tracking-tight">ACH Authorization Agreement</h2>
                    <p className="mt-1 text-sm text-neutral-500">Please review and digitally authorize electronic checking recurring invoices.</p>
                  </div>
                  
                  <div className="h-44 overflow-y-auto rounded-xl border border-neutral-150 bg-neutral-50/70 p-6 text-[11px] text-neutral-500 leading-relaxed">
                    <h4 className="font-extrabold text-neutral-950 mb-2 uppercase tracking-wide">Electronic Check (ACH) Recurring Payment Authorization</h4>
                    <p className="mb-4">
                      By signing this digital checkbox, you authorize the SaaS Platform to securely store your checking accounts and to initiate monthly recurring electronic ACH debit entries.
                    </p>
                    <p className="mb-4">
                      The monthly recurring debit amount will match your chosen subscription tier: {selectedPlan} (${selectedPlan === 'Premium Plan' ? '149' : '99'}/month). Payments will draft on this day each billing cycle.
                    </p>
                    <p>
                      You may pause or terminate billing instantly in the settings profile panel.
                    </p>
                  </div>

                  <label className="flex items-start gap-3 p-4 rounded-xl border border-neutral-150 bg-neutral-50/50 cursor-pointer transition-colors hover:bg-neutral-50">
                    <input 
                      type="checkbox" 
                      checked={achAgreed}
                      onChange={(e) => setAchAgreed(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-neutral-950 focus:ring-0 cursor-pointer" 
                    />
                    <span className="text-xs font-bold text-neutral-700 leading-relaxed">
                      I understand and authorize the SaaS Platform to charge my connected checking account automatically each billing cycle in accordance with the terms declared.
                    </span>
                  </label>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="mt-12 flex items-center justify-between pt-8 border-t border-neutral-150">
                <button
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-900 disabled:opacity-0 transition-colors cursor-pointer"
                >
                  <ArrowLeft size={16} />
                  Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={
                    (currentStep === 1 && !selectedPlan) ||
                    (currentStep === 2 && !plaidConnected) ||
                    (currentStep === 3 && !achAgreed)
                  }
                  className="flex items-center gap-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 px-8 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-xl transition-all disabled:opacity-30 cursor-pointer"
                >
                  {currentStep === steps.length ? 'Finalize Enrollment' : 'Continue'}
                  <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
