import React from 'react';
import type { PermissionAction } from '../constants/users';
import { usePermissions } from './permissions';

interface CanProps {
  action: PermissionAction;
  resource?: { ownerId?: string };
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Declarative UI guard component.
 * Renders children only if current user has the specified action permission.
 */
export const Can: React.FC<CanProps> = ({ action, resource, fallback = null, children }) => {
  const { can: checkPermission } = usePermissions();

  if (checkPermission(action, resource)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};
