import type { UserRole, UserStatus, PermissionAction } from '../constants/users';

/**
 * SECURITY RULES:
 * 1. Password fields exist EXCLUSIVELY in CreateUserDTO, ResetPasswordDTO, and ChangePasswordDTO.
 * 2. Passwords are NEVER part of any response type, stored model, query cache key, log or error message.
 * 3. Users are deactivated (ACTIVE / INACTIVE) and NEVER deleted, preserving foreign key integrity across accounts, contacts, and follow-ups.
 */

export interface User {
  id: string;
  name: string;
  code: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  email: string;
  phone?: string | null;
  photoUrl?: string | null;
  managerId: string | null;
  managerName?: string | null;
  permissions: PermissionAction[];
  createdDate: string; // YYYY-MM-DD
  updatedDate: string; // YYYY-MM-DD
}

export interface UserListItem extends User {
  accountCount: number;
  contactCount: number;
}

export interface UserOption {
  id: string;
  name: string;
  code: string;
  photoUrl?: string | null;
}

export interface CurrentUser {
  id: string;
  name: string;
  code: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  email: string;
  phone?: string | null;
  photoUrl?: string | null;
  managerId: string | null;
  managerName?: string | null;
  permissions: PermissionAction[];
}

export interface UserFilters {
  q?: string;
  role?: string;
  status?: string;
  managerId?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface PaginatedUsersResponse {
  content: UserListItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// Request DTOs
export interface CreateUserDTO {
  name: string;
  code?: string | null;
  username: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  email: string;
  phone?: string | null;
  managerId: string | null;
  permissions: PermissionAction[];
}

export interface UpdateUserDTO {
  name: string;
  code?: string | null;
  username: string;
  role: UserRole;
  status: UserStatus;
  email: string;
  phone?: string | null;
  managerId?: string | null;
}

/**
 * DTO for self-service profile update via PUT /api/me.
 * Contains ONLY name, email, and phone. A user can never change their own username, code, role, or status.
 */
export interface UpdateMyProfileDTO {
  name: string;
  email: string;
  phone?: string | null;
}

export interface UserPhotoResponse {
  photoUrl: string;
}

export interface UpdateUserStatusDTO {
  status: UserStatus;
}

export interface ResetPasswordDTO {
  newPassword: string;
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
}
