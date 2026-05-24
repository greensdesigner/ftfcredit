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

  React.useEffect(() => {
    const loadBranding = async () => {
      // 1. Always check system settings for the platform branding (GM, etc.)
      try {
        const res = await fetch('/api/admin/system-settings');
        const data = await res.json();
        if (data.systemLogo) {
          setSystemLogo(data.systemLogo);
        }
        // If an explicit system name is set, use it. 
        if (data.systemName && data.systemName !== 'FTF Consulting') {
          setSystemName(data.systemName);
          return;
        }
      } catch (e) {
        console.error("Failed to fetch system settings branding:", e);
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
                  {item.label}
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
                      {item.label}
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
        <header className="flex h-16 items-center justify-between border-b border-neutral-100 bg-white px-6 lg:px-10">
          <button className="text-neutral-500 lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu />
          </button>
          <div className="hidden lg:block">
             <h2 className="text-sm font-medium text-neutral-500">Welcome back, {user?.fullName}</h2>
          </div>
          <div className="flex items-center gap-4">
            {/* Icons removed per user request */}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
