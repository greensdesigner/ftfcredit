import DashboardLayout from '../components/DashboardLayout';
import { Users, CreditCard, AlertCircle, Search, Filter, MoreHorizontal, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '../lib/utils';

export default function AdminDashboard() {
  const stats = [
    { label: 'Total MRR', value: '$12,450', trend: '+12%', up: true },
    { label: 'Active Clients', value: '42', trend: '+3', up: true },
    { label: 'Failed Payments', value: '3', trend: 'Critical', up: false },
    { label: 'Pending ACH', value: '8', trend: 'Waitlist', up: true },
  ];

  const recentClients = [
    { id: '1', name: 'James Wilson', email: 'james.w@example.com', plan: 'Credit Repair', status: 'active', joined: '2h ago' },
    { id: '2', name: 'Sarah Connor', email: 'sarah.c@example.com', plan: 'Business Funding', status: 'pending', joined: '5h ago' },
    { id: '3', name: 'Mike Ross', email: 'mike.r@example.com', plan: 'Credit Repair', status: 'failed', joined: '1d ago' },
    { id: '4', name: 'Harvey Specter', email: 'harvey@pearson.com', plan: 'Business Funding', status: 'active', joined: '2d ago' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-7xl">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-4xl font-bold tracking-tight text-neutral-900">Admin Console</h1>
            <p className="text-neutral-500">Monitor system performance and manage client lifecycles.</p>
          </div>
          <button className="flex items-center gap-2 rounded-xl bg-neutral-900 px-6 py-3 text-sm font-bold text-white shadow-xl transition-all hover:bg-neutral-800">
             Export Reports
             <ArrowUpRight size={18} />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">{stat.label}</p>
              <div className="mt-3 flex items-baseline justify-between">
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
        <div className="rounded-3xl bg-red-50 border border-red-100 p-6">
           <div className="flex items-center gap-3 text-red-900 mb-4">
              <AlertCircle size={24} />
              <h3 className="font-bold text-lg">Failed Payment Alerts</h3>
           </div>
           <div className="space-y-3">
              {[
                { name: 'Mike Ross', amount: '$149', reason: 'Insufficient Funds', date: 'May 3' },
                { name: 'Rachel Zane', amount: '$149', reason: 'Incorrect Routing', date: 'May 2' },
              ].map(alert => (
                <div key={alert.name} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-sm">
                   <div className="flex items-center gap-4">
                      <div className="size-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 font-bold uppercase">{alert.name.charAt(0)}</div>
                      <div>
                        <p className="font-bold text-neutral-900">{alert.name}</p>
                        <p className="text-xs text-neutral-500">{alert.reason} • {alert.date}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-neutral-900">{alert.amount}</span>
                      <button className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-bold text-white">Retry / Pause</button>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Client Table */}
        <div className="rounded-3xl border border-neutral-100 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-neutral-100 p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
             <h3 className="font-display text-xl font-bold text-neutral-900">Recent Clients</h3>
             <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                  <input type="text" placeholder="Search clients..." className="rounded-xl border border-neutral-200 bg-neutral-50 pl-9 pr-4 py-2 text-xs outline-none focus:border-neutral-900" />
                </div>
                <button className="rounded-xl border border-neutral-200 p-2 text-neutral-500 hover:bg-neutral-50"><Filter size={16} /></button>
             </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-neutral-50/50 text-xs font-bold uppercase tracking-wider text-neutral-400">
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Plan</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-sm">
                {recentClients.map((client) => (
                  <tr key={client.id} className="group hover:bg-neutral-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                         <div className="size-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500 font-display font-bold uppercase">{client.name.charAt(0)}</div>
                         <div className="flex flex-col">
                            <span className="font-bold text-neutral-900">{client.name}</span>
                            <span className="text-xs text-neutral-500">{client.email}</span>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-neutral-600">{client.plan}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-tight",
                        client.status === 'active' ? "bg-emerald-50 text-emerald-600" :
                        client.status === 'pending' ? "bg-amber-50 text-amber-600" :
                        "bg-red-50 text-red-600"
                      )}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-neutral-500">{client.joined}</td>
                    <td className="px-6 py-4 text-right">
                       <button className="text-neutral-400 hover:text-neutral-900">
                          <MoreHorizontal size={20} />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-neutral-100 p-4 text-center">
             <button className="text-xs font-bold text-neutral-500 hover:text-neutral-900">View All Clients</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
