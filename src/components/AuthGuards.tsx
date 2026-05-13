import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export function ProtectedRoute({ allowedRoles }: { allowedRoles?: UserRole[] }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="size-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="text-neutral-500 font-medium animate-pulse uppercase tracking-[0.2em] text-[10px]">Verifying Protocol...</p>
      </div>
    </div>
  );

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export function PublicRoute() {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <div className="size-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
    </div>
  );

  if (user) {
    // Only auto-redirect clients to their dashboard.
    // Admins are left on public routes (like Login) to satisfy the request that the root 
    // link always leads to the client sign-in experience, and doesn't "leak" into admin portal.
    if (user.role === UserRole.CLIENT) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
}
