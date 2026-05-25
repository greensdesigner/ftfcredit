import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, CreditCard, Settings, LogOut, Menu, X, Bell, MessageSquare, Megaphone } from 'lucide-react';
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

  const menuItems = (user?.role === UserRole.ADMIN || isAdminAuthorized)
    ? [
        { icon: LayoutDashboard, label: 'Overview', path: '/admin-portal?tab=overview' },
        { icon: Users, label: 'Client List', path: '/admin-portal?tab=clients' },
        { icon: MessageSquare, label: 'Inbox', path: '/admin-portal?tab=inbox' },
        { icon: Megaphone, label: 'Marketing', path: '/admin-portal?tab=marketing' },
        { icon: CreditCard, label: 'System Billing', path: '/admin-portal?tab=billing' },
        { icon: Settings, label: 'Settings', path: '/admin-portal?tab=settings' },
      ]
    : [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: MessageSquare, label: 'Inbox', path: '/dashboard?tab=inbox' },
        { icon: CreditCard, label: 'Billing', path: '/dashboard/billing' },
        { icon: Settings, label: 'Profile', path: '/dashboard/profile' },
      ];

  const [systemName, setSystemName] = useState('FTF Consulting');
  const [systemLogo, setSystemLogo] = useState<string | null>(null);
  const [subscriptionDays, setSubscriptionDays] = useState<number | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);

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
    if (!user?.tenantId || !user?.uid || !user?.role) return;

    const fetchUnreadCount = async () => {
      try {
        const res = await fetch(`/api/messages/unread-count?tenantId=${user.tenantId}&uid=${user.uid}&role=${user.role}`);
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.count || 0);
        }
      } catch (e) {
        console.error("Failed to fetch unread count:", e);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 4000); // Poll every 4 seconds
    return () => clearInterval(interval);
  }, [user]);

  React.useEffect(() => {
    const loadBranding = async () => {
      let isGlobalBrandingApplied = false;
      // 1. Always check system settings for the platform branding and subscription
      try {
        const res = await fetch('/api/admin/system-settings');
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
        // If an explicit system name is set, use it. 
        if (data.systemName && data.systemName !== 'FTF Consulting') {
          setSystemName(data.systemName);
          isGlobalBrandingApplied = true;
        }
      } catch (e) {
        console.error("Failed to fetch system settings branding:", e);
      }

      if (isGlobalBrandingApplied) {
        return;
      }

      // 2. Fallback to Agency Name for white-labeling if no global platform name is set
      if (user?.role === 'admin' && user?.agencyName) {
        setSystemName(user.agencyName);
      } else if (user?.tenantId && user.role === 'client') {
        // Fetch the admin's agency name for this client
        fetch(`/api/users/${user.tenantId}`)
          .then(res => res.json())
          .then(data => {
            if (data.agencyName) setSystemName(data.agencyName);
          })
          .catch(console.error);
      }
    };

    loadBranding();
  }, [user]);

  return (
    <div className="flex min-h-screen bg-neutral-50 text-neutral-900">
      {/* Sidebar Desktop */}
      <aside className="hidden w-64 border-r border-neutral-200 bg-white lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-neutral-100 p-6">
            <Link to={(user?.role === UserRole.ADMIN || isAdminAuthorized) ? '/admin-portal?tab=overview' : '/dashboard'} className="flex items-center gap-2 font-display text-xl font-bold tracking-tight text-neutral-900">
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
              const isActive = currentPath === item.path || (item.path === '/admin-portal?tab=overview' && currentPath === '/admin-portal');
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
                  {item.label === 'Inbox' && unreadCount > 0 && (
                    <span className="bg-red-500 text-white font-extrabold rounded-full text-[10px] px-2 py-0.5 animate-pulse shrink-0">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-neutral-100 p-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
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
                <button onClick={() => setSidebarOpen(false)} className="text-neutral-500 shrink-0">
                  <X />
                </button>
              </div>
              <nav className="flex-1 space-y-1 p-4">
                {menuItems.map((item) => {
                  const isActive = currentPath === item.path || (item.path === '/admin-portal?tab=overview' && currentPath === '/admin-portal');
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
                      {item.label === 'Inbox' && unreadCount > 0 && (
                        <span className="bg-red-500 text-white font-extrabold rounded-full text-[10px] px-2 py-0.5 animate-pulse shrink-0">
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
              <div className="border-t border-neutral-100 p-4">
                <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50">
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
          <button className="text-neutral-500 lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu />
          </button>
          <div className="hidden lg:block">
             <h2 className="text-sm font-medium text-neutral-500">Welcome back, {user?.fullName}</h2>
          </div>

          {/* Centered Big Uppercase Subscription Message */}
          {(user?.role === UserRole.ADMIN || isAdminAuthorized) && subscriptionStatus !== null && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <div className={cn(
                "flex items-center gap-2.5 rounded-full px-5 py-2 text-xs md:text-sm font-black uppercase tracking-widest border transition-all shadow-sm",
                subscriptionStatus === 'active' 
                  ? "bg-emerald-50 border-emerald-300 text-emerald-900" 
                  : "bg-red-50 border-red-300 text-red-900"
              )}>
                <span className={cn(
                  "size-2 px-1 rounded-full shrink-0",
                  subscriptionStatus === 'active' ? "bg-emerald-500 animate-pulse" : "bg-red-500"
                )} />
                <span>
                  {subscriptionStatus === 'active' ? (
                    <>
                      SUBSCRIPTION: <span className="font-extrabold text-emerald-600">{subscriptionDays} {subscriptionDays === 1 ? 'DAY' : 'DAYS'}</span> LEFT
                    </>
                  ) : (
                    <span className="font-extrabold text-red-600">SUBSCRIPTION EXPIRED</span>
                  )}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            {/* Icons removed per user request */}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          {isSubscriptionExpired && location.pathname !== '/dashboard/billing' ? (
            <div className="flex h-full min-h-[60vh] items-center justify-center p-4">
              <div className="w-full max-w-xl bg-white rounded-[32px] border border-neutral-150 p-8 text-center shadow-xl relative overflow-hidden flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-red-650 bg-red-500"></div>
                
                <div className="size-16 rounded-3xl bg-red-50 text-red-500 flex items-center justify-center mb-6 shrink-0 animate-pulse">
                  <CreditCard size={28} />
                </div>
                
                <h2 className="text-xl md:text-2xl font-bold font-display text-neutral-900 mb-3 text-center">
                  আপনার ড্যাশবোর্ডটি বর্তমানে লক করা আছে!
                </h2>
                
                <p className="text-neutral-500 leading-relaxed mb-6 text-xs md:text-sm text-center max-w-md">
                  সেবার মেয়াদের ৩০ দিন উত্তীর্ণ হয়েছে অথবা পেমেন্ট সফলভাবে শেষ হয়নি। অনুগ্রহ করে ড্যাশবোর্ডটি পুনরায় সক্রিয় ও সচল করতে নিচের বাটনে ক্লিক করে কার্ডের মাধ্যমে পেমেন্ট সম্পন্ন করুন।
                </p>
                
                <button
                  onClick={() => navigate('/dashboard/billing')}
                  className="w-full sm:w-auto px-6 py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-2xl font-bold text-xs shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <CreditCard size={16} />
                  পেমেন্ট করুন এবং ড্যাশবোর্ড সক্রিয় করুন
                </button>
                
                <div className="mt-6 pt-5 border-t border-neutral-100 w-full italic text-[9px] text-neutral-400 font-extrabold uppercase tracking-widest text-center">
                  Secure Connection & Payments via Stripe
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
