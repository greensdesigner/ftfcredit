import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, CreditCard, Settings, LogOut, Menu, X, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { UserRole } from '../types';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    sessionStorage.removeItem('admin_authorized');
    navigate('/login');
  };

  const currentPath = location.pathname + location.search;
  const isAdminAuthorized = sessionStorage.getItem('admin_authorized') === 'true';

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: CreditCard, label: 'Billing & Plans', path: '/dashboard/billing' },
    { icon: Settings, label: 'Profile', path: '/dashboard/profile' },
  ];

  const [systemName, setSystemName] = useState('Premium SaaS Portal');
  const [systemLogo, setSystemLogo] = useState<string | null>(null);
  const [subscriptionDays, setSubscriptionDays] = useState<number | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);

  const isClient = user?.role === UserRole.CLIENT;
  const isSubscriptionExpired = React.useMemo(() => {
    if (!isClient) return false;
    if (!user?.sub_status || user?.sub_status !== 'active') return true;
    if (!user?.sub_expiry) return true;
    
    const expiry = new Date(user.sub_expiry);
    const now = new Date();
    return now > expiry;
  }, [user, isClient]);

  React.useEffect(() => {
    const loadBranding = async () => {
      try {
        const res = await fetch('/api/admin/system-settings');
        if (res.ok) {
          const data = await res.json();
          if (data.systemLogo) {
            setSystemLogo(data.systemLogo);
          }
          if (data.expiryDate) {
            const expiry = new Date(data.expiryDate);
            const now = new Date();
            const diffTime = expiry.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            setSubscriptionDays(diffDays > 0 ? diffDays : 0);
          }
          if (data.subscriptionStatus) {
            setSubscriptionStatus(data.subscriptionStatus);
          }
          if (data.systemName && data.systemName !== 'FTF Consulting') {
            setSystemName(data.systemName);
          }
        }
      } catch (e) {
        console.error("Failed to fetch system settings branding:", e);
      }
    };

    loadBranding();
  }, [user]);

  const isSuspended = user?.isSuspended === 1 || user?.isSuspended === true;

  if (isSuspended) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-white p-4 md:p-8 font-sans">
        <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-[32px] p-8 md:p-10 text-center shadow-2xl relative overflow-hidden flex flex-col items-center">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-red-500 animate-pulse"></div>
          
          <div className="size-20 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mb-6 shrink-0 animate-pulse">
            <CreditCard size={36} />
          </div>
          
          <h2 className="text-xl md:text-2xl font-black tracking-widest uppercase text-white mb-2">
            Dashboard Blocked
          </h2>
          <h3 className="text-neutral-400 text-xs tracking-widest uppercase font-extrabold mb-6">
            Subscription Expired or Unpaid
          </h3>
          
          <div className="space-y-4 text-center max-w-md mx-auto mb-8">
            <p className="text-neutral-300 text-sm leading-relaxed font-semibold">
              Your access has been suspended because your billing subscription has expired or an invoice remains unpaid. Please clear any outstanding balances to unlock your workspace instantly.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <button
              onClick={handleLogout}
              className="px-6 py-3.5 rounded-2xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white font-bold text-xs tracking-wider uppercase border border-neutral-700/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut size={14} /> Logout Session
            </button>
          </div>

          <div className="mt-8 pt-5 border-t border-neutral-850 w-full italic text-[9px] text-neutral-500 font-extrabold uppercase tracking-[0.25em] text-center">
            SaaS Security Protocol
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-neutral-50 text-neutral-900">
      {/* Sidebar Desktop */}
      <aside className="hidden w-64 border-r border-neutral-200 bg-white lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-neutral-100 p-6">
            <Link to="/dashboard" className="flex items-center gap-2 font-display text-xl font-bold tracking-tight text-neutral-900">
              {systemLogo ? (
                <img src={systemLogo} alt="Logo" className="h-8 max-w-[48px] object-contain rounded-md" referrerPolicy="no-referrer" />
              ) : (
                <div className="size-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white font-display shrink-0">
                  {systemName.charAt(0)}
                </div>
              )}
              <span className="truncate">{systemName}</span>
            </Link>
          </div>
          <nav className="flex-1 space-y-1 p-4">
            {menuItems.map((item) => {
              const isActive = currentPath === item.path;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-neutral-900 text-white shadow-lg" 
                      : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                  )}
                >
                  <item.icon size={20} />
                  <span className="flex-1">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-neutral-100 p-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 cursor-pointer"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-900/20 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)}>
          <aside className="w-64 h-full bg-white animate-in slide-in-from-left duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-neutral-100 p-6">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {systemLogo ? (
                    <img src={systemLogo} alt="Logo" className="h-7 max-w-[40px] object-contain rounded-md" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="size-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white font-display shrink-0">
                      {systemName.charAt(0)}
                    </div>
                  )}
                  <span className="font-display text-xl font-bold text-neutral-900 truncate">{systemName}</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="text-neutral-500 shrink-0 cursor-pointer">
                  <X />
                </button>
              </div>
              <nav className="flex-1 space-y-1 p-4">
                {menuItems.map((item) => {
                  const isActive = currentPath === item.path;
                  return (
                    <Link
                      key={item.label}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                        isActive 
                          ? "bg-neutral-900 text-white shadow-lg" 
                          : "text-neutral-600 hover:bg-neutral-50"
                      )}
                    >
                      <item.icon size={20} />
                      <span className="flex-1">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="border-t border-neutral-100 p-4">
                <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 cursor-pointer">
                  <LogOut size={20} />
                  Logout
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="relative flex h-16 items-center justify-between border-b border-neutral-100 bg-white px-6 lg:px-10">
          <button className="text-neutral-500 lg:hidden cursor-pointer" onClick={() => setSidebarOpen(true)}>
            <Menu />
          </button>
          <div className="hidden lg:block">
             <h2 className="text-sm font-medium text-neutral-500">Welcome back, {user?.fullName}</h2>
          </div>



          <div className="flex items-center gap-4">
            {/* Action items */}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          {isSubscriptionExpired && location.pathname !== '/dashboard/billing' ? (
            <div className="flex h-full min-h-[60vh] items-center justify-center p-4">
              <div className="w-full max-w-xl bg-white rounded-[32px] border border-neutral-150 p-8 text-center shadow-xl relative overflow-hidden flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500"></div>
                
                <div className="size-16 rounded-3xl bg-red-50 text-red-500 flex items-center justify-center mb-6 shrink-0 animate-pulse">
                  <CreditCard size={28} />
                </div>
                
                 <h2 className="text-xl md:text-2xl font-bold font-display text-neutral-900 mb-3 text-center">
                  Your Workspace is Locked!
                </h2>
                
                <p className="text-neutral-500 leading-relaxed mb-6 text-xs md:text-sm text-center max-w-md">
                  Your billing subscription has expired or has not been fully initialized yet. To reactivate and unlock your workspace immediately, please proceed to our billing and payment setups.
                </p>
                
                <button
                  onClick={() => navigate('/dashboard/billing')}
                  className="w-full sm:w-auto px-6 py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-2xl font-bold text-xs shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CreditCard size={16} />
                  Configure Billing & Unlock Workspace
                </button>
                
                <div className="mt-6 pt-5 border-t border-neutral-100 w-full italic text-[9px] text-neutral-400 font-extrabold uppercase tracking-widest text-center">
                  Secure Credit and Debit Billing Processing
                </div>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
