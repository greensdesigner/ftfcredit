import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { CreditCard, History, TrendingUp, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

export default function ClientDashboard() {
  const { user } = useAuth();

  const getStepStatus = (stepIdx: number) => {
    const currentStep = user?.onboardingStep || 1;
    if (currentStep > stepIdx + 1) return 'completed';
    if (currentStep === stepIdx + 1) return 'in-progress';
    return 'pending';
  };

  const progressSteps = [
    { label: 'Analysis Phase', description: 'Our experts are analyzing your credit report.', icon: TrendingUp },
    { label: 'Dispute Letters', description: 'Crafting legal dispute letters for local and national bureaus.', icon: History },
    { label: 'Sent to Bureaus', description: 'Letters have been dispatched and we are awaiting confirmation.', icon: Clock },
    { label: 'Verifying Results', description: 'Reviewing responses from creditors and credit bureaus.', icon: AlertTriangle },
  ];

  const stats = [
    { label: 'Plan Status', value: user?.plan_name || 'Standard', sub: user?.sub_status === 'active' ? 'Account Active' : 'Payment Required', icon: CreditCard, color: 'bg-indigo-600' },
    { label: 'Service Stage', value: user?.onboardingStep ? `Stage ${user.onboardingStep}` : 'Stage 1', sub: 'Active Processing', icon: TrendingUp, color: 'bg-emerald-600' },
    { label: 'Identity', value: 'Verified', sub: 'A-Rank Secure', icon: CheckCircle2, color: 'bg-blue-600' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-7xl animate-in fade-in slide-in-from-bottom-2 duration-500 text-left">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-4xl font-bold tracking-tight text-neutral-900 line-clamp-1">Welcome back, {user?.fullName?.split(' ')[0]}</h1>
          <p className="text-neutral-500">Track your progress and manage your financial growth.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="group relative overflow-hidden rounded-[32px] border border-neutral-100 bg-white p-8 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
              <div className={cn("absolute top-0 right-0 h-1.5 w-full", stat.color)}></div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">{stat.label}</p>
                  <p className="mt-3 text-3xl font-bold text-neutral-900 font-display">{stat.value}</p>
                  <p className="mt-1 text-xs font-medium text-neutral-500 italic">{stat.sub}</p>
                </div>
                <div className={cn("size-14 rounded-2xl flex items-center justify-center text-white shadow-lg", stat.color)}>
                  <stat.icon size={28} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Progress Tracking */}
          <div className="lg:col-span-2 rounded-[32px] border border-neutral-100 bg-white p-10 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <TrendingUp size={120} />
            </div>
            <div className="flex items-center justify-between mb-10">
              <h3 className="font-display text-2xl font-bold text-neutral-900">Mission Roadmap</h3>
              <span className="rounded-full bg-emerald-50 px-4 py-1.5 text-[10px] font-bold text-emerald-600 border border-emerald-100 uppercase tracking-tighter">Live Updates</span>
            </div>
            <div className="space-y-10 relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-1 before:bg-neutral-50">
              {progressSteps.map((step, idx) => {
                const status = getStepStatus(idx);
                return (
                  <div key={step.label} className="relative flex items-start gap-8 pl-12 group">
                    <div className={cn(
                      "absolute left-0 top-1 size-8 rounded-full border-4 border-white shadow-sm flex items-center justify-center transition-all duration-500 z-10",
                      status === 'completed' ? "bg-emerald-500 scale-110" : 
                      status === 'in-progress' ? "bg-amber-500 scale-125 ring-4 ring-amber-50" : "bg-neutral-100"
                    )}>
                      {status === 'completed' ? <CheckCircle2 size={16} className="text-white" /> : 
                       status === 'in-progress' ? <Clock size={16} className="text-white animate-pulse" /> : <div className="size-2 bg-neutral-300 rounded-full" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col">
                        <h4 className={cn("text-lg font-bold transition-colors", status === 'pending' ? "text-neutral-400" : "text-neutral-900")}>
                          {step.label}
                        </h4>
                        <p className="text-sm text-neutral-500 mt-1 max-w-md leading-relaxed">
                          {status === 'completed' ? 'This stage is completed. All goals met.' : 
                           status === 'in-progress' ? step.description : 
                           'Unlock this stage by completing previous milestones.'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Side Info */}
          <div className="space-y-6">
            <div className="rounded-[32px] border border-neutral-100 bg-white p-8 shadow-sm">
              <h3 className="font-display text-lg font-bold text-neutral-900 mb-6">Service Health</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                  <div className="flex items-center gap-3">
                    <div className="size-2 rounded-full bg-emerald-500"></div>
                    <span className="text-xs font-bold text-emerald-900 uppercase">Payment Sync</span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-600">ACTIVE</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50/50 border border-neutral-100">
                   <div className="flex items-center gap-3">
                    <div className="size-2 rounded-full bg-neutral-300"></div>
                    <span className="text-xs font-bold text-neutral-900 uppercase">Credit Refresh</span>
                  </div>
                  <span className="text-[10px] font-black text-neutral-400 italic">30D CYCLE</span>
                </div>
              </div>
              <button className="w-full mt-6 py-3 rounded-2xl bg-neutral-900 text-white text-xs font-bold hover:bg-neutral-800 transition-all">
                Request Mid-Cycle Update
              </button>
            </div>

            <div className="rounded-[32px] border-2 border-dashed border-neutral-100 bg-neutral-50/30 p-8 flex flex-col items-center text-center">
                <div className="size-12 rounded-full bg-white flex items-center justify-center shadow-sm mb-4">
                  <AlertTriangle className="text-amber-500" size={20} />
                </div>
                <p className="text-[11px] font-medium text-neutral-500 leading-relaxed uppercase tracking-wider">Need Professional Assistance?</p>
                <p className="text-xs text-neutral-400 mt-2">Connect with your assigned legal expert for a private strategy session.</p>
                <button className="mt-6 text-sm font-bold text-neutral-900 underline underline-offset-8 decoration-2 decoration-neutral-200 hover:decoration-neutral-900 transition-all">
                  Open Direct Channel
                </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
 }
