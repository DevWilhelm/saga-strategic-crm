import React from 'react';
import type { PermissionAction } from '../../constants/users';
import { usePermissions } from '../../auth/permissions';
import { useAuth } from '../../context/AuthContext';
import { NoAccessPage } from './NoAccessPage';

interface PermissionRouteProps {
  action: PermissionAction;
  children: React.ReactNode;
}

export const PermissionRoute: React.FC<PermissionRouteProps> = ({ action, children }) => {
  const { isLoading } = useAuth();
  const { can } = usePermissions();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--btn-primary)] border-t-transparent" />
          <span>Verifying access permissions...</span>
        </div>
      </div>
    );
  }

  if (!can(action)) {
    return <NoAccessPage requiredAction={action} />;
  }

  return <>{children}</>;
};
