import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, CreditCard, Settings, LogOut, Menu, X, ShieldCheck, Loader2 } from 'lucide-react';
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
  const [isPayingLicense, setIsPayingLicense] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const isClient = user?.role === UserRole.CLIENT;
  const isSubscriptionExpired = false;

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

  const handlePayLicense = async () => {
    setIsPayingLicense(true);
    setPayError(null);
    try {
      const res = await fetch('/api/admin/system-pay', {
        method: 'POST',
      });
      if (res.ok) {
        const dataRes = await fetch('/api/admin/system-settings');
        if (dataRes.ok) {
          const data = await dataRes.json();
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
        }
        alert("Payment successful! $100.00 subscription fee paid to Greenlab Technology. Your software has been unlocked successfully.");
      } else {
        throw new Error("Payment server offline or network failure. Please try again.");
      }
    } catch (e: any) {
      setPayError(e.message || "Failed to process payment");
    } finally {
      setIsPayingLicense(false);
    }
  };

  const isSuspended = subscriptionStatus === 'expired' || (subscriptionDays !== null && subscriptionDays <= 0);

  if (isSuspended) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-white p-4 md:p-8 font-sans">
        <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-[32px] p-8 md:p-10 text-center shadow-2xl relative overflow-hidden flex flex-col items-center">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-red-500 animate-pulse"></div>
          
          <div className="size-20 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mb-6 shrink-0 animate-pulse">
            <CreditCard size={36} />
          </div>
          
          <h2 className="text-xl md:text-2xl font-black tracking-widest uppercase text-white mb-2">
            Software License Locked
          </h2>
          <h3 className="text-neutral-400 text-xs tracking-widest uppercase font-extrabold mb-6">
            15-Day Free Trial Expired or Monthly Fee Unpaid
          </h3>
          
          <div className="space-y-4 text-center max-w-md mx-auto mb-8">
            <p className="text-neutral-300 text-sm leading-relaxed font-semibold">
              This software provides a <span className="text-emerald-400">15-day free trial</span> upon registration. Your trial has expired, and the software is now automatically locked.
            </p>
            <p className="text-neutral-400 text-xs leading-relaxed">
              To activate and restore full access, please pay the monthly <strong className="text-white">$100.00</strong> subscription fee to the software provider (<strong className="text-white">Greenlab Technology</strong>).
            </p>
          </div>

          {payError && (
            <div className="w-full mb-6 p-4 bg-red-950/40 border border-red-900/40 rounded-2xl text-red-400 text-xs font-semibold text-center">
              {payError}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <button
              onClick={handlePayLicense}
              disabled={isPayingLicense}
              className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800 text-white font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/20"
            >
              {isPayingLicense ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Processing Payment...
                </>
              ) : (
                <>
                  <CreditCard size={14} /> Pay $100.00 License Fee
                </>
              )}
            </button>
            <button
              onClick={handleLogout}
              className="px-6 py-3.5 rounded-2xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white font-bold text-xs tracking-wider uppercase border border-neutral-700/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut size={14} /> Logout Session
            </button>
          </div>

          <div className="mt-8 pt-5 border-t border-neutral-850 w-full italic text-[9px] text-neutral-500 font-extrabold uppercase tracking-[0.25em] text-center">
            SaaS Security Protocol • Powered by Greenlab Technology
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 text-neutral-900">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-neutral-200 bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: Branding & Desktop Links */}
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-neutral-900">
              {systemLogo ? (
                <img src={systemLogo} alt="Logo" className="h-8 max-w-[48px] object-contain rounded-md" referrerPolicy="no-referrer" />
              ) : (
                <div className="size-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white font-display shrink-0 text-sm">
                  {systemName.charAt(0)}
                </div>
              )}
              <span className="truncate max-w-[150px] md:max-w-[200px]">{systemName}</span>
            </Link>

            {/* Desktop Menu Items */}
            <nav className="hidden md:flex items-center gap-1">
              {menuItems.map((item) => {
                const isActive = currentPath === item.path;
                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-neutral-900 text-white shadow-sm" 
                        : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                    )}
                  >
                    <item.icon size={16} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: User welcome & logout */}
          <div className="flex items-center gap-4">
            <span className="hidden lg:inline text-xs font-semibold text-neutral-500">
              Welcome, <span className="text-neutral-900">{user?.fullName}</span>
            </span>

            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="flex md:hidden text-neutral-500 hover:text-neutral-900 cursor-pointer"
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Panel */}
        {isSidebarOpen && (
          <div className="border-t border-neutral-150 bg-white px-4 py-3 md:hidden space-y-1 animate-in slide-in-from-top duration-200">
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
                      ? "bg-neutral-900 text-white shadow-sm" 
                      : "text-neutral-600 hover:bg-neutral-50"
                  )}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <div className="border-t border-neutral-100 pt-2 mt-2">
              <button
                onClick={() => {
                  setSidebarOpen(false);
                  handleLogout();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 cursor-pointer"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-10">
        <div className="mx-auto max-w-7xl">
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
        </div>
      </main>
    </div>
  );
}
