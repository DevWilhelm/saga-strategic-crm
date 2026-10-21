import { useCallback } from 'react';
import type { PermissionAction, UserRole } from '../constants/users';
import { ROLE_PRESET_PERMISSIONS } from '../constants/users';
import type { CurrentUser } from '../types/user';
import { useAuth } from '../context/AuthContext';

export interface ResourceOwnershipContext {
  ownerId?: string | null;
  ownerManagerId?: string | null;
}

/**
 * Pure centralized helper function to evaluate if a user is permitted to perform an action.
 *
 * Rules:
 * 1. Base permissions derive strictly from the user's role (SUPER_ADMIN, ADMIN, MEMBER).
 * 2. Resource-level scoping:
 *    - 'account.edit':
 *      - SUPER_ADMIN & ADMIN: can edit any account.
 *      - MEMBER: can ONLY edit if resource.ownerId === user.id.
 *    - 'contact.edit', 'contact.close':
 *      - SUPER_ADMIN: can edit/close any contact.
 *      - ADMIN: can edit/close contacts owned by themselves or their assigned members.
 *      - MEMBER: can edit/close ONLY contacts they own (ownerId === user.id).
 *    - 'contact.delete':
 *      - SUPER_ADMIN: can delete any contact.
 *      - ADMIN: can delete contacts owned by themselves or their assigned members.
 *      - MEMBER: cannot delete contacts.
 *    - 'contact.reassignOwner':
 *      - SUPER_ADMIN: can reassign to any active user.
 *      - ADMIN: can reassign within their team.
 *      - MEMBER: cannot reassign.
 *    - 'followup.manage':
 *      - SUPER_ADMIN: can manage all follow-ups.
 *      - ADMIN: can manage follow-ups owned by self or team members.
 *      - MEMBER: can manage follow-ups ONLY on contacts they own (ownerId === user.id).
 */
export function can(
  action: PermissionAction,
  resource?: ResourceOwnershipContext,
  user?: CurrentUser | null
): boolean {
  if (!user || !user.role) return false;

  // 1. Role preset permission check
  const rolePermissions = ROLE_PRESET_PERMISSIONS[user.role] || [];
  if (!rolePermissions.includes(action)) {
    return false;
  }

  // 2. Resource-level checks
  if (!resource) return true;

  // Account editing
  if (action === 'account.edit' && resource.ownerId) {
    if (user.role === 'MEMBER' && resource.ownerId !== user.id) {
      return false;
    }
  }

  // Contact editing and closing
  if ((action === 'contact.edit' || action === 'contact.close') && resource.ownerId) {
    if (user.role === 'SUPER_ADMIN') return true;
    if (user.role === 'ADMIN') {
      // Admin can edit if it's their own contact or assigned to a member they manage
      if (resource.ownerId === user.id) return true;
      if (resource.ownerManagerId && resource.ownerManagerId === user.id) return true;
      // If ownerManagerId not passed, allow if matching admin
      return resource.ownerId === user.id || resource.ownerManagerId === user.id;
    }
    if (user.role === 'MEMBER') {
      return resource.ownerId === user.id;
    }
  }

  // Contact deletion
  if (action === 'contact.delete') {
    if (user.role === 'SUPER_ADMIN') return true;
    if (user.role === 'ADMIN' && resource.ownerId) {
      return resource.ownerId === user.id || resource.ownerManagerId === user.id;
    }
    return false;
  }

  // Contact reassign owner
  if (action === 'contact.reassignOwner') {
    return user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
  }

  // Follow-up management
  if (action === 'followup.manage' && resource.ownerId) {
    if (user.role === 'SUPER_ADMIN') return true;
    if (user.role === 'ADMIN') {
      return resource.ownerId === user.id || resource.ownerManagerId === user.id;
    }
    if (user.role === 'MEMBER') {
      return resource.ownerId === user.id;
    }
  }

  return true;
}

/**
 * Convenient domain-specific evaluation helpers
 */
export function canEditContact(
  contact: { ownerId: string; ownerManagerId?: string | null },
  user: CurrentUser | null
): boolean {
  return can('contact.edit', contact, user);
}

export function canCloseContact(
  contact: { ownerId: string; ownerManagerId?: string | null },
  user: CurrentUser | null
): boolean {
  return can('contact.close', contact, user);
}

export function canDeleteContact(
  contact: { ownerId: string; ownerManagerId?: string | null },
  user: CurrentUser | null
): boolean {
  return can('contact.delete', contact, user);
}

export function canManageFollowUp(
  resource: { ownerId: string; ownerManagerId?: string | null },
  user: CurrentUser | null
): boolean {
  return can('followup.manage', resource, user);
}

/**
 * React hook exposing permissions bound to the current authenticated user.
 */
export function usePermissions() {
  const { user } = useAuth();

  const checkPermission = useCallback(
    (action: PermissionAction, resource?: ResourceOwnershipContext) => {
      return can(action, resource, user);
    },
    [user]
  );

  return {
    can: checkPermission,
    user,
    role: user?.role as UserRole | undefined,
    permissions: user?.role ? ROLE_PRESET_PERMISSIONS[user.role] || [] : [],
    isSuperAdmin: user?.role === 'SUPER_ADMIN',
    isAdmin: user?.role === 'ADMIN',
    isMember: user?.role === 'MEMBER',
  };
}
