import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import OnboardingWizard from './pages/OnboardingWizard';
import ClientDashboard from './pages/ClientDashboard';
import AdminGate from './pages/AdminGate';
import BillingPage from './pages/BillingPage';
import ProfilePage from './pages/ProfilePage';
import { ProtectedRoute, PublicRoute } from './components/AuthGuards';
import { UserRole } from './types';
import DashboardLayout from './components/DashboardLayout';
import { AlertCircle } from 'lucide-react';

function MaintenancePage() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[32px] p-10 text-center shadow-xl">
        <div className="size-20 rounded-3xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={40} />
        </div>
        <h2 className="text-3xl font-bold font-display text-neutral-900 mb-4">Under Maintenance</h2>
        <p className="text-neutral-500 leading-relaxed mb-6">
          We are currently performing scheduled maintenance to improve our services. We'll be back online shortly. Thank you for your patience!
        </p>
        <div className="pt-6 border-t border-neutral-100 italic text-xs text-neutral-400 font-bold uppercase tracking-widest">
          Scheduled System Update
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/admin/system-settings');
        const data = await response.json();
        if (data.maintenanceMode) {
          // Additional check: Don't show maintenance for admin-like paths OR 
          // we could check the user role if we had access to auth here, 
          // but maintenance is usually for everyone except dev bypass.
          // For now, let's keep it simple.
          setIsMaintenance(true);
        }
      } catch (e) {
        console.error("Health check failed", e);
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, []);

  if (loading) return null;
  if (isMaintenance && !window.location.pathname.startsWith('/admin-portal')) {
    return <MaintenancePage />;
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Routes */}
          <Route element={<PublicRoute />}>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Route>

          {/* Protected Client Dashboard Routes */}
          <Route element={<ProtectedRoute allowedRoles={[UserRole.CLIENT]} />}>
            <Route path="/dashboard" element={<ClientDashboard />} />
            <Route path="/dashboard/billing" element={<BillingPage />} />
            <Route path="/dashboard/profile" element={<ProfilePage />} />
            <Route path="/onboarding" element={<OnboardingWizard />} />
          </Route>

          {/* Admin Entry Gate */}
          <Route path="/admin-portal" element={<AdminGate />} />
          
          {/* Protected Admin Sub-routes */}
          <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} />}>
            <Route path="/admin-portal/clients" element={<DashboardLayout><div>Clients List</div></DashboardLayout>} />
            <Route path="/admin-portal/payments" element={<DashboardLayout><div>Payments History</div></DashboardLayout>} />
            <Route path="/admin-portal/settings" element={<DashboardLayout><div>Settings</div></DashboardLayout>} />
          </Route>

          {/* Fallback for everything else */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
