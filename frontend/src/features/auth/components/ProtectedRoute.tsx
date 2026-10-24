import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

export const ProtectedRoute: React.FC = () => {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div
        role="status"
        className="flex min-h-screen items-center justify-center gap-2 bg-[var(--background)] text-sm text-[var(--text-secondary)]"
      >
        <Loader2 className="h-4 w-4 animate-spin text-[var(--btn-primary)]" />
        Checking your session…
      </div>
    );
  }

  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};
