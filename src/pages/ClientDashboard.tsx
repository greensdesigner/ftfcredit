import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { CreditCard, History, TrendingUp, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

export default function ClientDashboard() {
  const { user } = useAuth();

  const stats = [
    { label: 'Current Plan', value: 'Credit Repair', sub: '$149/mo', icon: CreditCard, color: 'bg-blue-500' },
    { label: 'Credit Score', value: '642', sub: '+18 pts last mo', icon: TrendingUp, color: 'bg-emerald-500' },
    { label: 'Payment Status', value: 'Successful', sub: 'Next: May 24', icon: CheckCircle2, color: 'bg-emerald-500' },
  ];

  const progressSteps = [
    { label: 'Identity Verification', status: 'completed', date: 'May 1, 2026' },
    { label: 'Credit Analysis', status: 'completed', date: 'May 3, 2026' },
    { label: 'Dispute Letter Batch #1', status: 'in-progress', date: 'Est. May 10' },
    { label: 'Lender Response', status: 'pending', date: '-' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-7xl">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-4xl font-bold tracking-tight text-neutral-900 line-clamp-1">Client Dashboard</h1>
          <p className="text-neutral-500">Track your progress and manage your financial growth.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="group relative overflow-hidden rounded-3xl border border-neutral-100 bg-white p-8 shadow-sm transition-all hover:shadow-md">
              <div className={cn("absolute top-0 right-0 h-1 w-full", stat.color)}></div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">{stat.label}</p>
                  <p className="mt-3 text-3xl font-bold text-neutral-900 font-display">{stat.value}</p>
                  <p className="mt-1 text-sm font-medium text-neutral-500">{stat.sub}</p>
                </div>
                <div className={cn("size-12 rounded-2xl flex items-center justify-center text-white", stat.color)}>
                  <stat.icon size={24} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Progress Tracking */}
          <div className="lg:col-span-2 rounded-3xl border border-neutral-100 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-display text-xl font-bold text-neutral-900">Service Progress</h3>
              <span className="rounded-full bg-neutral-50 px-3 py-1 text-xs font-bold text-neutral-600 uppercase">Batch #1</span>
            </div>
            <div className="space-y-8 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-100">
              {progressSteps.map((step, idx) => (
                <div key={step.label} className="relative flex items-start gap-6 pl-10">
                  <div className={cn(
                    "absolute left-0 top-1.5 size-7 rounded-full border-4 border-white shadow-sm flex items-center justify-center",
                    step.status === 'completed' ? "bg-emerald-500" : 
                    step.status === 'in-progress' ? "bg-amber-500" : "bg-neutral-200"
                  )}>
                    {step.status === 'completed' ? <CheckCircle2 size={14} className="text-white" /> : 
                     step.status === 'in-progress' ? <Clock size={14} className="text-white" /> : null}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className={cn("font-semibold", step.status === 'pending' ? "text-neutral-400" : "text-neutral-900")}>{step.label}</h4>
                      <span className="text-xs font-medium text-neutral-400">{step.date}</span>
                    </div>
                    <p className="text-sm text-neutral-500 mt-0.5">
                      {step.status === 'completed' ? 'Tasks finalized and verified.' : 
                       step.status === 'in-progress' ? 'Our agents are currently processing this step.' : 
                       'Waiting for previous steps to complete.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Side Info */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm">
              <h3 className="font-display text-lg font-bold text-neutral-900 mb-4">Automation Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 border border-emerald-100 px-4">
                  <div className="flex items-center gap-3">
                    <div className="size-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-sm font-semibold text-emerald-900">Auto-pay ON</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">ACTIVE</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 border border-neutral-100 px-4">
                   <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-neutral-900">Next SMS Alert</span>
                  </div>
                  <span className="text-xs font-bold text-neutral-500 italic">SCHEDULED</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-6 flex flex-col items-center text-center">
                <AlertTriangle className="text-neutral-400 mb-2" />
                <p className="text-xs font-medium text-neutral-500">Need immediate help? Contact your account manager directly via the secure portal.</p>
                <button className="mt-4 text-xs font-bold text-neutral-900 underline underline-offset-4">Open Support Ticket</button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
