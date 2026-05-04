import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import OnboardingWizard from './pages/OnboardingWizard';
import ClientDashboard from './pages/ClientDashboard';
import AdminDashboard from './pages/AdminDashboard';
import BillingPage from './pages/BillingPage';
import { ProtectedRoute, PublicRoute } from './components/AuthGuards';
import { UserRole } from './types';
import DashboardLayout from './components/DashboardLayout';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Route>

          {/* Protected Client Routes */}
          <Route element={<ProtectedRoute allowedRoles={[UserRole.CLIENT]} />}>
            <Route path="/dashboard" element={<ClientDashboard />} />
            <Route path="/dashboard/billing" element={<BillingPage />} />
            <Route path="/dashboard/profile" element={<DashboardLayout><div className="max-w-xl space-y-8"><h1 className="font-display text-4xl font-bold text-neutral-900">Profile Settings</h1><div className="p-8 rounded-3xl border border-neutral-100 bg-white space-y-6"><div className="flex items-center gap-4"><div className="size-16 rounded-2xl bg-neutral-900 text-white flex items-center justify-center font-display text-2xl font-bold">JD</div><div><h3 className="font-bold text-lg">John Doe</h3><p className="text-neutral-500 text-sm">john@example.com</p></div></div><div className="space-y-4 pt-6 border-t border-neutral-100 text-sm"><div className="flex justify-between"><span>Phone</span><span className="font-bold">+1 (555) 123-4567</span></div><div className="flex justify-between"><span>Account Status</span><span className="font-bold text-emerald-600">Verified</span></div></div><button className="w-full rounded-xl bg-neutral-900 py-3 text-sm font-bold text-white shadow-xl">Edit Profile</button></div></div></DashboardLayout>} />
            <Route path="/onboarding" element={<OnboardingWizard />} />
          </Route>

          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/clients" element={<DashboardLayout><div>Clients List</div></DashboardLayout>} />
            <Route path="/admin/payments" element={<DashboardLayout><div>Payments History</div></DashboardLayout>} />
            <Route path="/admin/settings" element={<DashboardLayout><div>Settings</div></DashboardLayout>} />
          </Route>

          {/* Fallback */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
