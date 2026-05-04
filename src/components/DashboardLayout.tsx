import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, CreditCard, Settings, LogOut, Menu, X, Bell } from 'lucide-react';
import { cn } from '../lib/utils';
import { UserRole } from '../types';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = user?.role === UserRole.ADMIN 
    ? [
        { icon: LayoutDashboard, label: 'Overview', path: '/admin' },
        { icon: Users, label: 'Clients', path: '/admin/clients' },
        { icon: CreditCard, label: 'Payments', path: '/admin/payments' },
        { icon: Settings, label: 'Settings', path: '/admin/settings' },
      ]
    : [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: CreditCard, label: 'Billing', path: '/dashboard/billing' },
        { icon: Settings, label: 'Profile', path: '/dashboard/profile' },
      ];

  return (
    <div className="flex min-h-screen bg-neutral-50 text-neutral-900">
      {/* Sidebar Desktop */}
      <aside className="hidden w-64 border-r border-neutral-200 bg-white lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-neutral-100 p-6">
            <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold tracking-tight text-neutral-900">
              <div className="size-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white font-display">FTF</div>
              <span>FTF Consulting</span>
            </Link>
          </div>
          <nav className="flex-1 space-y-1 p-4">
            {menuItems.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            ))}
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
                <span className="font-display text-xl font-bold text-neutral-900">FTF Consulting</span>
                <button onClick={() => setSidebarOpen(false)} className="text-neutral-500">
                  <X />
                </button>
              </div>
              <nav className="flex-1 space-y-1 p-4">
                {menuItems.map((item) => (
                  <Link
                    key={item.label}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
                  >
                    <item.icon size={20} />
                    {item.label}
                  </Link>
                ))}
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
            <button className="relative rounded-full p-2 text-neutral-500 hover:bg-neutral-50">
              <Bell size={20} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500"></span>
            </button>
            <div className="h-8 w-8 rounded-full bg-neutral-900 flex items-center justify-center text-white text-xs font-bold uppercase truncate">
              {user?.fullName?.charAt(0) || '?'}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
