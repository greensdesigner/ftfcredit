import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
            <Route path="/dashboard/profile" element={<ProfilePage />} />
            <Route path="/onboarding" element={<OnboardingWizard />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<Navigate to="/admin-portal" replace />} />
          <Route path="/admin-portal" element={<AdminGate />} />
          
          <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} />}>
            <Route path="/admin-portal/clients" element={<DashboardLayout><div>Clients List</div></DashboardLayout>} />
            <Route path="/admin-portal/payments" element={<DashboardLayout><div>Payments History</div></DashboardLayout>} />
            <Route path="/admin-portal/settings" element={<DashboardLayout><div>Settings</div></DashboardLayout>} />
          </Route>

          {/* Fallback */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
