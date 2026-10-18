import { useCallback } from 'react';
import type { PermissionAction } from '../constants/users';
import { ROLE_PRESET_PERMISSIONS } from '../constants/users';
import type { CurrentUser } from '../types/user';
import { useAuth } from '../context/AuthContext';

/**
 * Pure helper function to evaluate if a user is permitted to perform an action.
 *
 * Rules:
 * 1. Permissions come SOLELY from the role through the single permission map in this module.
 *    There are no per-user permission overrides in the ER diagram or security model.
 * 2. Resource-level check for 'account.edit':
 *    - ADMIN: can edit any account.
 *    - MEMBER: can ONLY edit if the resource's ownerId matches the user's ID.
 *    - VIEWER: cannot edit accounts.
 */
export function can(
  action: PermissionAction,
  resource?: { ownerId?: string },
  user?: CurrentUser | null
): boolean {
  if (!user || !user.role) return false;

  // Single permission map: permissions derive strictly from the user's role
  const rolePermissions = ROLE_PRESET_PERMISSIONS[user.role] || [];
  if (!rolePermissions.includes(action)) {
    return false;
  }

  // Specific resource rule for editing accounts: Members can only edit accounts they own
  if (action === 'account.edit' && resource && resource.ownerId) {
    if (user.role !== 'ADMIN' && resource.ownerId !== user.id) {
      return false;
    }
  }

  return true;
}

/**
 * React hook exposing permissions bound to the current authenticated user.
 */
export function usePermissions() {
  const { user } = useAuth();

  const checkPermission = useCallback(
    (action: PermissionAction, resource?: { ownerId?: string }) => {
      return can(action, resource, user);
    },
    [user]
  );

  return {
    can: checkPermission,
    user,
    role: user?.role,
    permissions: user?.role ? ROLE_PRESET_PERMISSIONS[user.role] || [] : [],
  };
}
